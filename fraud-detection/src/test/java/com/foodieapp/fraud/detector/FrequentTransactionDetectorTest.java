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

class FrequentTransactionDetectorTest {

    private KeyedOneInputStreamOperatorTestHarness<String, Transaction, FraudAlert> testHarness;

    @BeforeEach
    void setUp() throws Exception {
        FrequentTransactionDetector detector = new FrequentTransactionDetector(3, 60_000);
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
    void shouldNotAlertWhenBelowThreshold() throws Exception {
        long baseTime = Instant.parse("2026-01-01T00:00:00Z").toEpochMilli();

        testHarness.processElement(new StreamRecord<>(createTx("tx1", "payer1", baseTime), baseTime));
        testHarness.processElement(new StreamRecord<>(createTx("tx2", "payer1", baseTime + 10_000), baseTime + 10_000));
        testHarness.processElement(new StreamRecord<>(createTx("tx3", "payer1", baseTime + 20_000), baseTime + 20_000));

        assertThat(testHarness.extractOutputStreamRecords()).isEmpty();
    }

    @Test
    void shouldAlertWhenExceedingThreshold() throws Exception {
        long baseTime = Instant.parse("2026-01-01T00:00:00Z").toEpochMilli();

        testHarness.processElement(new StreamRecord<>(createTx("tx1", "payer1", baseTime), baseTime));
        testHarness.processElement(new StreamRecord<>(createTx("tx2", "payer1", baseTime + 10_000), baseTime + 10_000));
        testHarness.processElement(new StreamRecord<>(createTx("tx3", "payer1", baseTime + 20_000), baseTime + 20_000));
        testHarness.processElement(new StreamRecord<>(createTx("tx4", "payer1", baseTime + 30_000), baseTime + 30_000));

        var alerts = testHarness.extractOutputStreamRecords();
        assertThat(alerts).hasSize(1);
        assertThat(alerts.get(0).getValue().getAlertType()).isEqualTo(FraudAlert.AlertType.FREQUENT_TRANSACTIONS);
        assertThat(alerts.get(0).getValue().getPayerId()).isEqualTo("payer1");
    }

    @Test
    void shouldNotAlertForDifferentPayers() throws Exception {
        long baseTime = Instant.parse("2026-01-01T00:00:00Z").toEpochMilli();

        testHarness.processElement(new StreamRecord<>(createTx("tx1", "payer1", baseTime), baseTime));
        testHarness.processElement(new StreamRecord<>(createTx("tx2", "payer2", baseTime + 10_000), baseTime + 10_000));
        testHarness.processElement(new StreamRecord<>(createTx("tx3", "payer1", baseTime + 20_000), baseTime + 20_000));
        testHarness.processElement(new StreamRecord<>(createTx("tx4", "payer2", baseTime + 30_000), baseTime + 30_000));

        assertThat(testHarness.extractOutputStreamRecords()).isEmpty();
    }

    @Test
    void shouldResetAfterWindowExpires() throws Exception {
        long baseTime = Instant.parse("2026-01-01T00:00:00Z").toEpochMilli();

        testHarness.processElement(new StreamRecord<>(createTx("tx1", "payer1", baseTime), baseTime));
        testHarness.processElement(new StreamRecord<>(createTx("tx2", "payer1", baseTime + 10_000), baseTime + 10_000));
        testHarness.processElement(new StreamRecord<>(createTx("tx3", "payer1", baseTime + 20_000), baseTime + 20_000));

        // Advance watermark past window expiry to trigger timer
        testHarness.processWatermark(new Watermark(baseTime + 70_000));

        // New window should start fresh
        long newBase = baseTime + 120_000;
        testHarness.processElement(new StreamRecord<>(createTx("tx5", "payer1", newBase), newBase));
        testHarness.processElement(new StreamRecord<>(createTx("tx6", "payer1", newBase + 10_000), newBase + 10_000));

        assertThat(testHarness.extractOutputStreamRecords()).isEmpty();
    }

    private Transaction createTx(String id, String payerId, long timestampMs) {
        return new Transaction(id, Instant.ofEpochMilli(timestampMs), payerId, "Payer",
                "receiver1", "Receiver", 100.0, 52.0, 21.0, 50.0, 19.0, "PLN");
    }
}
