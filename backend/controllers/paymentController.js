import asyncHandler from "express-async-handler";
import Booking from "../models/Booking.js";
import Payment from "../models/Payment.js";

/**
 * @desc    Create a new payment
 * @route   POST /api/payments
 * @access  Private
 */
export const createPayment = asyncHandler(async (req, res) => {
  const { bookingId, amount, paymentMethod, paymentDetails } = req.body;

  // Verify the booking exists and belongs to the user
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  // Check if booking belongs to the authenticated user
  if (booking.guest.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to create payment for this booking");
  }

  // Create payment record
  const payment = await Payment.create({
    booking: bookingId,
    guest: req.user._id,
    amount,
    paymentMethod,
    paymentDetails,
    status: "pending"
  });

  res.status(201).json(payment);
});

/**
 * @desc    Get payment by booking ID
 * @route   GET /api/payments/:bookingId
 * @access  Private
 */
export const getPaymentByBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  // Verify the booking exists
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  // Check authorization - guest can only see their own payments
  if (req.user.role === "guest" && booking.guest.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to view this payment");
  }

  // Find payment for this booking
  const payment = await Payment.findOne({ booking: bookingId })
    .populate("booking", "roomNumber checkIn checkOut totalPrice")
    .populate("guest", "name email");

  if (!payment) {
    res.status(404);
    throw new Error("Payment not found for this booking");
  }

  res.json(payment);
});

/**
 * @desc    Update booking to paid
 * @route   PUT /api/payments/:id/pay
 * @access  Private
 */
export const updateBookingToPaid = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  booking.isPaid = true;
  booking.paidAt = Date.now();
  booking.paymentMethod = req.body.paymentMethod || "cash"; // "cash", "card", "paypal", etc.
  booking.paymentResult = {
    id: req.body.id || null, // transaction ID from Stripe/PayPal
    status: req.body.status || "completed",
    update_time: req.body.update_time || new Date(),
    email_address: req.body.email_address || req.user.email,
  };

  const updatedBooking = await booking.save();
  res.json(updatedBooking);
});

/**
 * @desc    Get payment status for a booking
 * @route   GET /api/payments/:id/status
 * @access  Private
 */
export const getPaymentStatus = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  res.json({
    isPaid: booking.isPaid,
    paidAt: booking.paidAt,
    paymentMethod: booking.paymentMethod,
    paymentResult: booking.paymentResult,
  });
});
