package com.foodieapp.fraud;

import com.foodieapp.fraud.detector.DistantTransactionDetector;
import com.foodieapp.fraud.detector.FrequentTransactionDetector;
import com.foodieapp.fraud.detector.SmallAmountAggregationDetector;
import com.foodieapp.fraud.model.FraudAlert;
import com.foodieapp.fraud.model.Transaction;
import com.foodieapp.fraud.source.TransactionDeserializationSchema;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.connector.kafka.source.KafkaSource;
import org.apache.flink.connector.kafka.source.enumerator.initializer.OffsetsInitializer;
import org.apache.flink.connector.kafka.source.reader.deserializer.KafkaRecordDeserializationSchema;
import org.apache.flink.streaming.api.datastream.DataStream;
import org.apache.flink.streaming.api.datastream.SingleOutputStreamOperator;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;

import java.time.Duration;

/**
 * Main Flink job that wires together the fraud detection pipeline.
 *
 * <p>The pipeline reads transactions from a Kafka topic, fans the stream out to three
 * independent fraud detection processors, unions the resulting alerts, and prints them
 * to stdout (a sink can be substituted later).</p>
 *
 * <h2>Pipeline topology</h2>
 * <pre>
 *   Kafka Source (transactions)
 *         │
 *         ├──► FrequentTransactionDetector  ──► alerts
 *         ├──► DistantTransactionDetector   ──► alerts
 *         └──► SmallAmountAggregationDetector ──► alerts
 *                                                  │
 *                                              union all
 *                                                  │
 *                                              Alert Sink
 * </pre>
 */
public class FraudDetectionJob {

    // Kafka configuration defaults
    private static final String DEFAULT_BOOTSTRAP_SERVERS = "localhost:9092";
    private static final String DEFAULT_TOPIC = "transactions";
    private static final String DEFAULT_GROUP_ID = "fraud-detection";

    // Frequent transaction detector defaults
    private static final int FREQUENT_TX_MAX_COUNT = 5;
    private static final long FREQUENT_TX_WINDOW_MS = 60_000; // 1 minute

    // Distant transaction detector defaults
    private static final double DISTANT_TX_MAX_DISTANCE_KM = 500.0;
    private static final long DISTANT_TX_MAX_TIME_GAP_MS = 300_000; // 5 minutes

    // Small amount aggregation detector defaults
    private static final double SMALL_AMOUNT_THRESHOLD = 50.0;
    private static final double AGGREGATE_SUM_THRESHOLD = 10_000.0;
    private static final long SMALL_AMOUNT_WINDOW_MS = 3_600_000; // 1 hour

    public static void main(String[] args) throws Exception {
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();

        String bootstrapServers = getEnvOrDefault("KAFKA_BOOTSTRAP_SERVERS", DEFAULT_BOOTSTRAP_SERVERS);
        String topic = getEnvOrDefault("KAFKA_TOPIC", DEFAULT_TOPIC);
        String groupId = getEnvOrDefault("KAFKA_GROUP_ID", DEFAULT_GROUP_ID);

        DataStream<FraudAlert> alerts = buildPipeline(env, bootstrapServers, topic, groupId);

        alerts.print().name("fraud-alert-sink");

        env.execute("Fraud Detection Pipeline");
    }

    /**
     * Builds the fraud detection pipeline and returns the unified alert stream.
     * Extracted for testability.
     */
    public static DataStream<FraudAlert> buildPipeline(StreamExecutionEnvironment env,
                                                        String bootstrapServers,
                                                        String topic,
                                                        String groupId) {
        KafkaSource<Transaction> kafkaSource = KafkaSource.<Transaction>builder()
                .setBootstrapServers(bootstrapServers)
                .setTopics(topic)
                .setGroupId(groupId)
                .setStartingOffsets(OffsetsInitializer.latest())
                .setDeserializer(KafkaRecordDeserializationSchema.valueOnly(new TransactionDeserializationSchema()))
                .build();

        WatermarkStrategy<Transaction> watermarkStrategy = WatermarkStrategy
                .<Transaction>forBoundedOutOfOrderness(Duration.ofSeconds(5))
                .withTimestampAssigner((transaction, recordTimestamp) ->
                        transaction.getTransactionDate().toEpochMilli());

        DataStream<Transaction> transactions = env
                .fromSource(kafkaSource, watermarkStrategy, "kafka-transactions-source");

        // Fan out to three independent fraud detectors
        SingleOutputStreamOperator<FraudAlert> frequentAlerts = transactions
                .keyBy(Transaction::getPayerId)
                .process(new FrequentTransactionDetector(FREQUENT_TX_MAX_COUNT, FREQUENT_TX_WINDOW_MS))
                .name("frequent-transaction-detector");

        SingleOutputStreamOperator<FraudAlert> distantAlerts = transactions
                .keyBy(Transaction::getPayerId)
                .process(new DistantTransactionDetector(DISTANT_TX_MAX_DISTANCE_KM, DISTANT_TX_MAX_TIME_GAP_MS))
                .name("distant-transaction-detector");

        SingleOutputStreamOperator<FraudAlert> smallAmountAlerts = transactions
                .keyBy(Transaction::getPayerId)
                .process(new SmallAmountAggregationDetector(
                        SMALL_AMOUNT_THRESHOLD, AGGREGATE_SUM_THRESHOLD, SMALL_AMOUNT_WINDOW_MS))
                .name("small-amount-aggregation-detector");

        return frequentAlerts
                .union(distantAlerts)
                .union(smallAmountAlerts);
    }

    private static String getEnvOrDefault(String key, String defaultValue) {
        String value = System.getenv(key);
        return value != null && !value.isEmpty() ? value : defaultValue;
    }
}
