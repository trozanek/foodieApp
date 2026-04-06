package com.foodieapp.fraud.detector;

import com.foodieapp.fraud.model.FraudAlert;
import com.foodieapp.fraud.model.Transaction;
import org.apache.flink.api.common.typeinfo.TypeInformation;
import org.apache.flink.streaming.api.operators.KeyedProcessOperator;
import org.apache.flink.streaming.api.watermark.Watermark;
import org.apache.flink.streaming.runtime.streamrecord.StreamRecord;
import org.apache.flink.streaming.util.KeyedOneInputStreamOperatorTestHarness;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class SmallAmountAggregationDetectorTest {

    private KeyedOneInputStreamOperatorTestHarness<String, Transaction, FraudAlert> testHarness;

    @BeforeEach
    void setUp() throws Exception {
        // smallAmountThreshold=50, aggregateSumThreshold=200, window=60s
        SmallAmountAggregationDetector detector = new SmallAmountAggregationDetector(50.0, 200.0, 60_000);
        testHarness = new KeyedOneInputStreamOperatorTestHarness<>(
                new KeyedProcessOperator<>(detector),
                Transaction::getPayerId,
                TypeInformation.of(String.class));
        testHarness.open();
    }

    @AfterEach
    void tearDown() throws Exception {
        testHarness.close();
    }

    @Test
    void shouldAlertWhenSmallTransactionsSumExceedsThreshold() throws Exception {
        long baseTime = Instant.parse("2026-01-01T00:00:00Z").toEpochMilli();

        // 5 transactions of 45 each = 225 total (> 200 threshold)
        for (int i = 0; i < 5; i++) {
            long ts = baseTime + (i * 5_000L);
            testHarness.processElement(new StreamRecord<>(
                    createTx("tx" + i, "payer1", ts, 45.0), ts));
        }

        var alerts = testHarness.extractOutputStreamRecords();
        assertThat(alerts).hasSize(1);
        assertThat(alerts.get(0).getValue().getAlertType()).isEqualTo(FraudAlert.AlertType.SMALL_AMOUNT_AGGREGATION);
        assertThat(alerts.get(0).getValue().getPayerId()).isEqualTo("payer1");
    }

    @Test
    void shouldIgnoreLargeTransactions() throws Exception {
        long baseTime = Instant.parse("2026-01-01T00:00:00Z").toEpochMilli();

        // Transactions with amount >= 50 should be ignored
        for (int i = 0; i < 10; i++) {
            long ts = baseTime + (i * 5_000L);
            testHarness.processElement(new StreamRecord<>(
                    createTx("tx" + i, "payer1", ts, 100.0), ts));
        }

        assertThat(testHarness.extractOutputStreamRecords()).isEmpty();
    }

    @Test
    void shouldNotAlertWhenBelowAggregateThreshold() throws Exception {
        long baseTime = Instant.parse("2026-01-01T00:00:00Z").toEpochMilli();

        // 3 transactions of 40 each = 120 total (< 200 threshold)
        for (int i = 0; i < 3; i++) {
            long ts = baseTime + (i * 5_000L);
            testHarness.processElement(new StreamRecord<>(
                    createTx("tx" + i, "payer1", ts, 40.0), ts));
        }

        assertThat(testHarness.extractOutputStreamRecords()).isEmpty();
    }

    @Test
    void shouldResetAfterWindowExpires() throws Exception {
        long baseTime = Instant.parse("2026-01-01T00:00:00Z").toEpochMilli();

        // 3 small transactions in first window
        for (int i = 0; i < 3; i++) {
            long ts = baseTime + (i * 5_000L);
            testHarness.processElement(new StreamRecord<>(
                    createTx("tx" + i, "payer1", ts, 40.0), ts));
        }

        // Advance watermark past window to trigger cleanup
        testHarness.processWatermark(new Watermark(baseTime + 70_000));

        // New window - 3 more small transactions should not trigger alert
        long newBase = baseTime + 120_000;
        for (int i = 0; i < 3; i++) {
            long ts = newBase + (i * 5_000L);
            testHarness.processElement(new StreamRecord<>(
                    createTx("tx-new" + i, "payer1", ts, 40.0), ts));
        }

        assertThat(testHarness.extractOutputStreamRecords()).isEmpty();
    }

    @Test
    void shouldTrackDifferentPayersSeparately() throws Exception {
        long baseTime = Instant.parse("2026-01-01T00:00:00Z").toEpochMilli();

        // Payer1: 3 transactions of 45 = 135 (below threshold)
        for (int i = 0; i < 3; i++) {
            long ts = baseTime + (i * 5_000L);
            testHarness.processElement(new StreamRecord<>(
                    createTx("tx-p1-" + i, "payer1", ts, 45.0), ts));
        }

        // Payer2: 3 transactions of 45 = 135 (below threshold)
        for (int i = 0; i < 3; i++) {
            long ts = baseTime + (i * 5_000L);
            testHarness.processElement(new StreamRecord<>(
                    createTx("tx-p2-" + i, "payer2", ts, 45.0), ts));
        }

        // Neither should trigger (they are separate)
        assertThat(testHarness.extractOutputStreamRecords()).isEmpty();
    }

    private Transaction createTx(String id, String payerId, long timestampMs, double amount) {
        return new Transaction(id, Instant.ofEpochMilli(timestampMs), payerId, "Payer",
                "receiver1", "Receiver", amount, 52.0, 21.0, 50.0, 19.0, "PLN");
    }
}
