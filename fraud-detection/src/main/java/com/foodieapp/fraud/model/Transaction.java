package com.foodieapp.fraud.model;

import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;

/**
 * Represents a financial transaction flowing through the fraud detection pipeline.
 */
public class Transaction implements Serializable {

    private static final long serialVersionUID = 1L;

    private String transactionId;
    private Instant transactionDate;
    private String payerId;
    private String payerName;
    private String receiverId;
    private String receiverName;
    private double amount;
    private double payerLatitude;
    private double payerLongitude;
    private double receiverLatitude;
    private double receiverLongitude;
    private String currency;

    public Transaction() {
    }

    public Transaction(String transactionId, Instant transactionDate, String payerId, String payerName,
                       String receiverId, String receiverName, double amount,
                       double payerLatitude, double payerLongitude,
                       double receiverLatitude, double receiverLongitude, String currency) {
        this.transactionId = transactionId;
        this.transactionDate = transactionDate;
        this.payerId = payerId;
        this.payerName = payerName;
        this.receiverId = receiverId;
        this.receiverName = receiverName;
        this.amount = amount;
        this.payerLatitude = payerLatitude;
        this.payerLongitude = payerLongitude;
        this.receiverLatitude = receiverLatitude;
        this.receiverLongitude = receiverLongitude;
        this.currency = currency;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public Instant getTransactionDate() {
        return transactionDate;
    }

    public void setTransactionDate(Instant transactionDate) {
        this.transactionDate = transactionDate;
    }

    public String getPayerId() {
        return payerId;
    }

    public void setPayerId(String payerId) {
        this.payerId = payerId;
    }

    public String getPayerName() {
        return payerName;
    }

    public void setPayerName(String payerName) {
        this.payerName = payerName;
    }

    public String getReceiverId() {
        return receiverId;
    }

    public void setReceiverId(String receiverId) {
        this.receiverId = receiverId;
    }

    public String getReceiverName() {
        return receiverName;
    }

    public void setReceiverName(String receiverName) {
        this.receiverName = receiverName;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public double getPayerLatitude() {
        return payerLatitude;
    }

    public void setPayerLatitude(double payerLatitude) {
        this.payerLatitude = payerLatitude;
    }

    public double getPayerLongitude() {
        return payerLongitude;
    }

    public void setPayerLongitude(double payerLongitude) {
        this.payerLongitude = payerLongitude;
    }

    public double getReceiverLatitude() {
        return receiverLatitude;
    }

    public void setReceiverLatitude(double receiverLatitude) {
        this.receiverLatitude = receiverLatitude;
    }

    public double getReceiverLongitude() {
        return receiverLongitude;
    }

    public void setReceiverLongitude(double receiverLongitude) {
        this.receiverLongitude = receiverLongitude;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Transaction that = (Transaction) o;
        return Objects.equals(transactionId, that.transactionId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(transactionId);
    }

    @Override
    public String toString() {
        return "Transaction{" +
                "transactionId='" + transactionId + '\'' +
                ", transactionDate=" + transactionDate +
                ", payerId='" + payerId + '\'' +
                ", receiverId='" + receiverId + '\'' +
                ", amount=" + amount +
                ", currency='" + currency + '\'' +
                '}';
    }
}
