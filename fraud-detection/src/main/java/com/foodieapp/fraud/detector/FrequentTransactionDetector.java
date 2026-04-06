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
 * Detects suspiciously frequent transactions from the same payer.
 *
 * <p>Maintains a count of transactions within a sliding time window. If the number of
 * transactions from a single payer exceeds the configured threshold within the window,
 * a fraud alert is emitted.</p>
 *
 * <p>Keyed by payer ID.</p>
 */
public class FrequentTransactionDetector extends KeyedProcessFunction<String, Transaction, FraudAlert> {

    private static final long serialVersionUID = 1L;

    private final int maxTransactions;
    private final long windowMillis;

    private transient ValueState<Integer> transactionCountState;
    private transient ValueState<Long> windowStartState;

    /**
     * @param maxTransactions maximum allowed transactions within the window before triggering an alert
     * @param windowMillis    time window size in milliseconds
     */
    public FrequentTransactionDetector(int maxTransactions, long windowMillis) {
        this.maxTransactions = maxTransactions;
        this.windowMillis = windowMillis;
    }

    @Override
    public void open(Configuration parameters) {
        transactionCountState = getRuntimeContext().getState(
                new ValueStateDescriptor<>("frequent-tx-count", Types.INT));
        windowStartState = getRuntimeContext().getState(
                new ValueStateDescriptor<>("frequent-tx-window-start", Types.LONG));
    }

    @Override
    public void processElement(Transaction transaction, Context ctx, Collector<FraudAlert> out) throws Exception {
        long txTime = transaction.getTransactionDate().toEpochMilli();

        Long windowStart = windowStartState.value();
        Integer count = transactionCountState.value();

        if (windowStart == null || txTime - windowStart > windowMillis) {
            // Start a new window
            windowStartState.update(txTime);
            transactionCountState.update(1);

            // Register a timer to clean up state after the window expires
            ctx.timerService().registerEventTimeTimer(txTime + windowMillis);
        } else {
            int newCount = (count == null ? 0 : count) + 1;
            transactionCountState.update(newCount);

            if (newCount > maxTransactions) {
                double riskScore = Math.min(1.0, (double) newCount / (maxTransactions * 2));
                out.collect(new FraudAlert(
                        UUID.randomUUID().toString(),
                        FraudAlert.AlertType.FREQUENT_TRANSACTIONS,
                        transaction.getTransactionId(),
                        transaction.getPayerId(),
                        String.format("Payer %s made %d transactions within %d ms (threshold: %d)",
                                transaction.getPayerId(), newCount, windowMillis, maxTransactions),
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
            transactionCountState.clear();
            windowStartState.clear();
        }
    }
}
