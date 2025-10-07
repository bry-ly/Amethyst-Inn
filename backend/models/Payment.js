// models/Payment.js - Updated version with Stripe support
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true
    },
    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: "usd",
      uppercase: true
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "online", "stripe"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "succeeded", "failed", "refunded", "cancelled"],
      default: "pending",
      index: true
    },
    
    // Stripe-specific fields
    stripePaymentIntentId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    stripeCustomerId: {
      type: String,
      index: true
    },
    stripeChargeId: {
      type: String,
      index: true
    },
    
    // Legacy transaction ID
    transactionId: {
      type: String,
      index: true
    },
    
    // Payment metadata
    paymentDetails: {
      brand: String,
      last4: String,
      country: String,
      expiryMonth: Number,
      expiryYear: Number
    },
    
    // Refund information
    refundAmount: {
      type: Number,
      default: 0
    },
    refundReason: String,
    refundedAt: Date,
    
    // Error handling
    errorMessage: String,
    errorCode: String,
    
    // Receipt
    receiptUrl: String,
    receiptEmail: String
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ guest: 1, status: 1 });

// Virtuals
paymentSchema.virtual('isSuccessful').get(function() {
  return this.status === 'succeeded';
});

paymentSchema.virtual('canBeRefunded').get(function() {
  return this.status === 'succeeded' && this.refundAmount < this.amount;
});

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
