package com.foodieapp.fraud.model;

import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;

/**
 * Represents a fraud alert emitted by one of the fraud detection processors.
 */
public class FraudAlert implements Serializable {

    private static final long serialVersionUID = 1L;

    public enum AlertType {
        FREQUENT_TRANSACTIONS,
        DISTANT_TRANSACTIONS,
        SMALL_AMOUNT_AGGREGATION
    }

    private String alertId;
    private AlertType alertType;
    private String transactionId;
    private String payerId;
    private String description;
    private Instant detectedAt;
    private double riskScore;

    public FraudAlert() {
    }

    public FraudAlert(String alertId, AlertType alertType, String transactionId,
                      String payerId, String description, Instant detectedAt, double riskScore) {
        this.alertId = alertId;
        this.alertType = alertType;
        this.transactionId = transactionId;
        this.payerId = payerId;
        this.description = description;
        this.detectedAt = detectedAt;
        this.riskScore = riskScore;
    }

    public String getAlertId() {
        return alertId;
    }

    public void setAlertId(String alertId) {
        this.alertId = alertId;
    }

    public AlertType getAlertType() {
        return alertType;
    }

    public void setAlertType(AlertType alertType) {
        this.alertType = alertType;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public String getPayerId() {
        return payerId;
    }

    public void setPayerId(String payerId) {
        this.payerId = payerId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Instant getDetectedAt() {
        return detectedAt;
    }

    public void setDetectedAt(Instant detectedAt) {
        this.detectedAt = detectedAt;
    }

    public double getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(double riskScore) {
        this.riskScore = riskScore;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        FraudAlert that = (FraudAlert) o;
        return Objects.equals(alertId, that.alertId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(alertId);
    }

    @Override
    public String toString() {
        return "FraudAlert{" +
                "alertId='" + alertId + '\'' +
                ", alertType=" + alertType +
                ", transactionId='" + transactionId + '\'' +
                ", payerId='" + payerId + '\'' +
                ", description='" + description + '\'' +
                ", riskScore=" + riskScore +
                '}';
    }
}
