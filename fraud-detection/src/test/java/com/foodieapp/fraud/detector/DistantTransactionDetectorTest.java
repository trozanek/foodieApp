package com.foodieapp.fraud.detector;

import com.foodieapp.fraud.model.FraudAlert;
import com.foodieapp.fraud.model.Transaction;
import org.apache.flink.api.common.typeinfo.TypeInformation;
import org.apache.flink.streaming.api.operators.KeyedProcessOperator;
import org.apache.flink.streaming.runtime.streamrecord.StreamRecord;
import org.apache.flink.streaming.util.KeyedOneInputStreamOperatorTestHarness;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class DistantTransactionDetectorTest {

    private KeyedOneInputStreamOperatorTestHarness<String, Transaction, FraudAlert> testHarness;

    @BeforeEach
    void setUp() throws Exception {
        // Alert if distance > 500 km within 5 minutes
        DistantTransactionDetector detector = new DistantTransactionDetector(500.0, 300_000);
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
    void shouldAlertWhenDistantTransactionsInShortTime() throws Exception {
        long baseTime = Instant.parse("2026-01-01T00:00:00Z").toEpochMilli();

        // Transaction in Warsaw (52.23, 21.01)
        Transaction tx1 = new Transaction("tx1", Instant.ofEpochMilli(baseTime), "payer1", "Payer",
                "receiver1", "Receiver", 100.0, 52.23, 21.01, 50.0, 19.0, "PLN");

        // Transaction in Madrid (40.42, -3.70) - ~2300 km away, 2 minutes later
        Transaction tx2 = new Transaction("tx2", Instant.ofEpochMilli(baseTime + 120_000), "payer1", "Payer",
                "receiver2", "Receiver", 200.0, 40.42, -3.70, 50.0, 19.0, "PLN");

        testHarness.processElement(new StreamRecord<>(tx1, baseTime));
        testHarness.processElement(new StreamRecord<>(tx2, baseTime + 120_000));

        var alerts = testHarness.extractOutputStreamRecords();
        assertThat(alerts).hasSize(1);
        assertThat(alerts.get(0).getValue().getAlertType()).isEqualTo(FraudAlert.AlertType.DISTANT_TRANSACTIONS);
        assertThat(alerts.get(0).getValue().getPayerId()).isEqualTo("payer1");
    }

    @Test
    void shouldNotAlertWhenNearbyTransactions() throws Exception {
        long baseTime = Instant.parse("2026-01-01T00:00:00Z").toEpochMilli();

        // Two transactions in the same city (Warsaw area)
        Transaction tx1 = new Transaction("tx1", Instant.ofEpochMilli(baseTime), "payer1", "Payer",
                "receiver1", "Receiver", 100.0, 52.23, 21.01, 50.0, 19.0, "PLN");
        Transaction tx2 = new Transaction("tx2", Instant.ofEpochMilli(baseTime + 60_000), "payer1", "Payer",
                "receiver2", "Receiver", 200.0, 52.25, 21.05, 50.0, 19.0, "PLN");

        testHarness.processElement(new StreamRecord<>(tx1, baseTime));
        testHarness.processElement(new StreamRecord<>(tx2, baseTime + 60_000));

        assertThat(testHarness.extractOutputStreamRecords()).isEmpty();
    }

    @Test
    void shouldNotAlertWhenDistantButTimeFarApart() throws Exception {
        long baseTime = Instant.parse("2026-01-01T00:00:00Z").toEpochMilli();

        Transaction tx1 = new Transaction("tx1", Instant.ofEpochMilli(baseTime), "payer1", "Payer",
                "receiver1", "Receiver", 100.0, 52.23, 21.01, 50.0, 19.0, "PLN");

        // Same distance but 10 minutes later (> 5 min threshold)
        Transaction tx2 = new Transaction("tx2", Instant.ofEpochMilli(baseTime + 600_000), "payer1", "Payer",
                "receiver2", "Receiver", 200.0, 40.42, -3.70, 50.0, 19.0, "PLN");

        testHarness.processElement(new StreamRecord<>(tx1, baseTime));
        testHarness.processElement(new StreamRecord<>(tx2, baseTime + 600_000));

        assertThat(testHarness.extractOutputStreamRecords()).isEmpty();
    }

    @Test
    void haversineDistanceShouldBeAccurate() {
        // Warsaw to Krakow is roughly 252 km
        double distance = DistantTransactionDetector.haversineDistance(52.23, 21.01, 50.06, 19.94);
        assertThat(distance).isCloseTo(252.0, within(10.0));

        // Warsaw to Madrid is roughly 2300 km
        double longDistance = DistantTransactionDetector.haversineDistance(52.23, 21.01, 40.42, -3.70);
        assertThat(longDistance).isCloseTo(2300.0, within(50.0));
    }
}
