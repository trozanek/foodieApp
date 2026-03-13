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
 * Detects suspiciously distant transactions from the same payer in a short period of time.
 *
 * <p>Compares the payer location of each incoming transaction against the payer location of
 * the previous transaction. If the geographic distance exceeds the configured threshold
 * and the time gap is smaller than the configured maximum, a fraud alert is emitted.</p>
 *
 * <p>Uses the Haversine formula for distance calculation. Keyed by payer ID.</p>
 */
public class DistantTransactionDetector extends KeyedProcessFunction<String, Transaction, FraudAlert> {

    private static final long serialVersionUID = 1L;
    private static final double EARTH_RADIUS_KM = 6_371.0;

    private final double maxDistanceKm;
    private final long maxTimeGapMillis;

    private transient ValueState<Double> lastLatitudeState;
    private transient ValueState<Double> lastLongitudeState;
    private transient ValueState<Long> lastTimestampState;

    /**
     * @param maxDistanceKm    distance threshold in kilometers that triggers an alert
     * @param maxTimeGapMillis maximum time gap in milliseconds between two transactions to consider them suspicious
     */
    public DistantTransactionDetector(double maxDistanceKm, long maxTimeGapMillis) {
        this.maxDistanceKm = maxDistanceKm;
        this.maxTimeGapMillis = maxTimeGapMillis;
    }

    @Override
    public void open(Configuration parameters) {
        lastLatitudeState = getRuntimeContext().getState(
                new ValueStateDescriptor<>("distant-last-lat", Types.DOUBLE));
        lastLongitudeState = getRuntimeContext().getState(
                new ValueStateDescriptor<>("distant-last-lon", Types.DOUBLE));
        lastTimestampState = getRuntimeContext().getState(
                new ValueStateDescriptor<>("distant-last-ts", Types.LONG));
    }

    @Override
    public void processElement(Transaction transaction, Context ctx, Collector<FraudAlert> out) throws Exception {
        long txTime = transaction.getTransactionDate().toEpochMilli();
        double currentLat = transaction.getPayerLatitude();
        double currentLon = transaction.getPayerLongitude();

        Long lastTimestamp = lastTimestampState.value();
        Double lastLat = lastLatitudeState.value();
        Double lastLon = lastLongitudeState.value();

        if (lastTimestamp != null && lastLat != null && lastLon != null) {
            long timeDelta = txTime - lastTimestamp;

            if (timeDelta > 0 && timeDelta <= maxTimeGapMillis) {
                double distance = haversineDistance(lastLat, lastLon, currentLat, currentLon);

                if (distance > maxDistanceKm) {
                    double riskScore = Math.min(1.0, distance / (maxDistanceKm * 3));
                    out.collect(new FraudAlert(
                            UUID.randomUUID().toString(),
                            FraudAlert.AlertType.DISTANT_TRANSACTIONS,
                            transaction.getTransactionId(),
                            transaction.getPayerId(),
                            String.format("Payer %s transacted %.1f km apart within %d ms (threshold: %.1f km in %d ms)",
                                    transaction.getPayerId(), distance, timeDelta, maxDistanceKm, maxTimeGapMillis),
                            Instant.now(),
                            riskScore
                    ));
                }
            }
        }

        // Update state with current transaction
        lastLatitudeState.update(currentLat);
        lastLongitudeState.update(currentLon);
        lastTimestampState.update(txTime);

        // Register timer to expire state after the time gap window
        ctx.timerService().registerEventTimeTimer(txTime + maxTimeGapMillis);
    }

    @Override
    public void onTimer(long timestamp, OnTimerContext ctx, Collector<FraudAlert> out) throws Exception {
        Long lastTs = lastTimestampState.value();
        if (lastTs != null && timestamp >= lastTs + maxTimeGapMillis) {
            lastLatitudeState.clear();
            lastLongitudeState.clear();
            lastTimestampState.clear();
        }
    }

    /**
     * Calculates the great-circle distance between two points using the Haversine formula.
     */
    static double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }
}
