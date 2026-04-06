package com.foodieapp.fraud.detector;

import com.foodieapp.fraud.model.FraudAlert;
import com.foodieapp.fraud.model.Transaction;
import org.apache.flink.api.common.state.ValueState;
import org.apache.flink.api.common.state.ValueStateDescriptor;
import org.apache.flink.api.common.typeinfo.Types;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.functions.KeyedProcessFunction;
import org.apache.flink.util.Collector;

import java.time.Instant;
import java.util.UUID;

/**
 * Detects a pattern of many small transactions that sum up to a larger amount.
 *
 * <p>This is a common money laundering technique known as "structuring" or "smurfing",
 * where large sums are broken into many small transactions to avoid detection thresholds.</p>
 *
 * <p>Maintains a running sum and count of transactions below a configured individual
 * threshold within a time window. If the aggregate sum exceeds the configured total
 * threshold, a fraud alert is emitted.</p>
 *
 * <p>Keyed by payer ID.</p>
 */
public class SmallAmountAggregationDetector extends KeyedProcessFunction<String, Transaction, FraudAlert> {

    private static final long serialVersionUID = 1L;

    private final double smallAmountThreshold;
    private final double aggregateSumThreshold;
    private final long windowMillis;

    private transient ValueState<Double> runningSumState;
    private transient ValueState<Integer> transactionCountState;
    private transient ValueState<Long> windowStartState;

    /**
     * @param smallAmountThreshold  individual transaction amount threshold to be considered "small"
     * @param aggregateSumThreshold total sum threshold that triggers an alert
     * @param windowMillis          time window in milliseconds
     */
    public SmallAmountAggregationDetector(double smallAmountThreshold, double aggregateSumThreshold, long windowMillis) {
        this.smallAmountThreshold = smallAmountThreshold;
        this.aggregateSumThreshold = aggregateSumThreshold;
        this.windowMillis = windowMillis;
    }

    @Override
    public void open(Configuration parameters) {
        runningSumState = getRuntimeContext().getState(
                new ValueStateDescriptor<>("small-agg-sum", Types.DOUBLE));
        transactionCountState = getRuntimeContext().getState(
                new ValueStateDescriptor<>("small-agg-count", Types.INT));
        windowStartState = getRuntimeContext().getState(
                new ValueStateDescriptor<>("small-agg-window-start", Types.LONG));
    }

    @Override
    public void processElement(Transaction transaction, Context ctx, Collector<FraudAlert> out) throws Exception {
        if (transaction.getAmount() >= smallAmountThreshold) {
            return; // Not a "small" transaction, skip
        }

        long txTime = transaction.getTransactionDate().toEpochMilli();

        Long windowStart = windowStartState.value();
        Double runningSum = runningSumState.value();
        Integer count = transactionCountState.value();

        if (windowStart == null || txTime - windowStart > windowMillis) {
            // Start a new window
            windowStartState.update(txTime);
            runningSumState.update(transaction.getAmount());
            transactionCountState.update(1);

            ctx.timerService().registerEventTimeTimer(txTime + windowMillis);
        } else {
            double newSum = (runningSum == null ? 0.0 : runningSum) + transaction.getAmount();
            int newCount = (count == null ? 0 : count) + 1;

            runningSumState.update(newSum);
            transactionCountState.update(newCount);

            if (newSum >= aggregateSumThreshold) {
                double riskScore = Math.min(1.0, newSum / (aggregateSumThreshold * 2));
                out.collect(new FraudAlert(
                        UUID.randomUUID().toString(),
                        FraudAlert.AlertType.SMALL_AMOUNT_AGGREGATION,
                        transaction.getTransactionId(),
                        transaction.getPayerId(),
                        String.format("Payer %s made %d small transactions (each < %.2f) totaling %.2f within %d ms (threshold: %.2f)",
                                transaction.getPayerId(), newCount, smallAmountThreshold,
                                newSum, windowMillis, aggregateSumThreshold),
                        Instant.now(),
                        riskScore
                ));
            }
        }
    }

    @Override
    public void onTimer(long timestamp, OnTimerContext ctx, Collector<FraudAlert> out) throws Exception {
        // Only clear state if this timer belongs to the current window.
        // A new window may have started before this timer fired.
        Long windowStart = windowStartState.value();
        if (windowStart != null && timestamp >= windowStart + windowMillis) {
            runningSumState.clear();
            transactionCountState.clear();
            windowStartState.clear();
        }
    }
}
