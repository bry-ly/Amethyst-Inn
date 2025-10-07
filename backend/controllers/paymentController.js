// controllers/paymentController.js - Stripe-enabled version
import asyncHandler from "express-async-handler";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";
import * as stripeService from "../services/stripeService.js";

/**
 * @desc    Get Stripe publishable key
 * @route   GET /api/payments/config
 * @access  Public
 */
export const getStripeConfig = asyncHandler(async (req, res) => {
  res.json({
    publishableKey: stripeService.getPublishableKey()
  });
});

/**
 * @desc    Create a payment intent for a booking
 * @route   POST /api/payments/create-payment-intent
 * @access  Private
 */
export const createPaymentIntent = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;

  const booking = await Booking.findById(bookingId).populate('guest', 'name email');
  
  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  if (booking.guest._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to create payment for this booking");
  }

  if (booking.isPaid) {
    res.status(400);
    throw new Error("Booking is already paid");
  }

  // Check for existing payment
  let payment = await Payment.findOne({ 
    booking: bookingId, 
    status: { $in: ['pending', 'processing', 'succeeded'] }
  });

  let paymentIntent;

  if (payment && payment.stripePaymentIntentId) {
    try {
      paymentIntent = await stripeService.retrievePaymentIntent(payment.stripePaymentIntentId);
      if (paymentIntent.status === 'succeeded') {
        payment = null;
      }
    } catch (error) {
      payment = null;
    }
  }

  if (!payment || !paymentIntent) {
    const customer = await stripeService.createOrRetrieveCustomer({
      email: booking.guest.email,
      name: booking.guest.name,
      userId: booking.guest._id
    });

    paymentIntent = await stripeService.createPaymentIntent({
      amount: booking.totalPrice,
      currency: process.env.STRIPE_CURRENCY || 'usd',
      bookingId: booking._id,
      guestEmail: booking.guest.email,
      guestName: booking.guest.name,
      metadata: {
        roomId: booking.room.toString(),
        checkInDate: booking.checkInDate.toISOString(),
        checkOutDate: booking.checkOutDate.toISOString()
      }
    });

    if (payment) {
      payment.stripePaymentIntentId = paymentIntent.id;
      payment.stripeCustomerId = customer.id;
      payment.status = 'processing';
      await payment.save();
    } else {
      payment = await Payment.create({
        booking: bookingId,
        guest: req.user._id,
        amount: booking.totalPrice,
        currency: paymentIntent.currency,
        paymentMethod: 'stripe',
        status: 'processing',
        stripePaymentIntentId: paymentIntent.id,
        stripeCustomerId: customer.id,
        receiptEmail: booking.guest.email
      });
    }
  }

  res.status(200).json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    paymentId: payment._id
  });
});

/**
 * @desc    Confirm payment after successful Stripe payment
 * @route   POST /api/payments/confirm
 * @access  Private
 */
export const confirmPayment = asyncHandler(async (req, res) => {
  const { paymentIntentId } = req.body;

  if (!paymentIntentId) {
    res.status(400);
    throw new Error("Payment Intent ID is required");
  }

  const paymentIntent = await stripeService.retrievePaymentIntent(paymentIntentId);
  const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });

  if (!payment) {
    res.status(404);
    throw new Error("Payment record not found");
  }

  if (payment.guest.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized");
  }

  if (paymentIntent.status === 'succeeded') {
    payment.status = 'succeeded';
    payment.transactionId = paymentIntent.id;
    
    if (paymentIntent.charges && paymentIntent.charges.data.length > 0) {
      const charge = paymentIntent.charges.data[0];
      payment.stripeChargeId = charge.id;
      payment.receiptUrl = charge.receipt_url;
      
      if (charge.payment_method_details && charge.payment_method_details.card) {
        payment.paymentDetails = {
          brand: charge.payment_method_details.card.brand,
          last4: charge.payment_method_details.card.last4,
          country: charge.payment_method_details.card.country,
          expiryMonth: charge.payment_method_details.card.exp_month,
          expiryYear: charge.payment_method_details.card.exp_year
        };
      }
    }

    await payment.save();

    const booking = await Booking.findById(payment.booking);
    if (booking) {
      booking.isPaid = true;
      booking.paidAt = new Date();
      booking.paymentMethod = 'stripe';
      booking.status = 'confirmed';
      booking.paymentResult = {
        id: paymentIntent.id,
        status: paymentIntent.status,
        update_time: new Date(),
        email_address: payment.receiptEmail,
        amount: payment.amount,
        currency: payment.currency
      };
      await booking.save();
    }

    res.json({
      success: true,
      message: "Payment confirmed successfully",
      payment,
      booking
    });
  } else {
    payment.status = paymentIntent.status;
    await payment.save();

    res.status(400).json({
      success: false,
      message: `Payment status: ${paymentIntent.status}`,
      payment
    });
  }
});

/**
 * @desc    Handle Stripe webhooks
 * @route   POST /api/payments/webhook
 * @access  Public (verified by Stripe signature)
 */
export const handleStripeWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  
  let event;
  try {
    event = stripeService.constructWebhookEvent(req.rawBody, signature);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object);
      break;
    
    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(event.data.object);
      break;
    
    case 'charge.refunded':
      await handleChargeRefunded(event.data.object);
      break;
    
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// Webhook handlers
const handlePaymentIntentSucceeded = async (paymentIntent) => {
  const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });
  
  if (!payment) {
    console.error(`Payment not found for payment intent: ${paymentIntent.id}`);
    return;
  }

  payment.status = 'succeeded';
  payment.transactionId = paymentIntent.id;
  await payment.save();

  const booking = await Booking.findById(payment.booking);
  if (booking && !booking.isPaid) {
    booking.isPaid = true;
    booking.paidAt = new Date();
    booking.paymentMethod = 'stripe';
    booking.status = 'confirmed';
    booking.paymentResult = {
      id: paymentIntent.id,
      status: 'succeeded',
      update_time: new Date(),
      amount: payment.amount,
      currency: payment.currency
    };
    await booking.save();
    console.log(`Booking ${booking._id} marked as paid via webhook`);
  }
};

const handlePaymentIntentFailed = async (paymentIntent) => {
  const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });
  
  if (!payment) return;

  payment.status = 'failed';
  payment.errorMessage = paymentIntent.last_payment_error?.message || 'Payment failed';
  payment.errorCode = paymentIntent.last_payment_error?.code;
  await payment.save();
  console.log(`Payment ${payment._id} failed: ${payment.errorMessage}`);
};

const handleChargeRefunded = async (charge) => {
  const payment = await Payment.findOne({ stripeChargeId: charge.id });
  
  if (!payment) return;

  payment.status = 'refunded';
  payment.refundAmount = charge.amount_refunded / 100;
  payment.refundedAt = new Date();
  await payment.save();

  const booking = await Booking.findById(payment.booking);
  if (booking) {
    booking.isPaid = false;
    booking.status = 'cancelled';
    await booking.save();
  }
  console.log(`Payment ${payment._id} refunded: $${payment.refundAmount}`);
};

/**
 * @desc    Initiate refund
 * @route   POST /api/payments/:id/refund
 * @access  Private/Admin
 */
export const refundPayment = asyncHandler(async (req, res) => {
  const { amount, reason } = req.body;
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  if (payment.status !== 'succeeded') {
    res.status(400);
    throw new Error("Only succeeded payments can be refunded");
  }

  if (!payment.stripePaymentIntentId) {
    res.status(400);
    throw new Error("No Stripe payment intent found");
  }

  const refund = await stripeService.refundPayment(
    payment.stripePaymentIntentId,
    amount,
    reason
  );

  payment.status = 'refunded';
  payment.refundAmount = refund.amount / 100;
  payment.refundReason = reason;
  payment.refundedAt = new Date();
  await payment.save();

  const booking = await Booking.findById(payment.booking);
  if (booking) {
    booking.isPaid = false;
    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    booking.cancelledAt = new Date();
    booking.cancelledBy = req.user._id;
    await booking.save();
  }

  res.json({
    success: true,
    message: "Refund processed successfully",
    payment,
    refund
  });
});

/**
 * @desc    Get payment by booking ID
 * @route   GET /api/payments/booking/:bookingId
 * @access  Private
 */
export const getPaymentByBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  if (req.user.role === "guest" && booking.guest.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to view this payment");
  }

  const payment = await Payment.findOne({ booking: bookingId })
    .populate("booking", "room checkInDate checkOutDate totalPrice status")
    .populate("guest", "name email");

  if (!payment) {
    res.status(404);
    throw new Error("Payment not found for this booking");
  }

  res.json(payment);
});

/**
 * @desc    Get all payments (admin)
 * @route   GET /api/payments
 * @access  Private/Admin
 */
export const getAllPayments = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  
  const query = {};
  if (status) query.status = status;

  const payments = await Payment.find(query)
    .populate("booking", "room checkInDate checkOutDate totalPrice")
    .populate("guest", "name email")
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Payment.countDocuments(query);

  res.json({
    payments,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    total: count
  });
});
