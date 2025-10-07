import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Guest from "../models/Guest.js";

/**
 * @desc    Create guest profile
 * @route   POST /api/guests
 * @access  Private (guest only)
 */
export const createGuestProfile = asyncHandler(async (req, res) => {
  const { phone, address, emergencyContact, preferences } = req.body;

  // Check if guest profile already exists
  let guest = await Guest.findOne({ user: req.user._id });
  
  if (guest) {
    res.status(400);
    throw new Error("Guest profile already exists");
  }

  // Create guest profile
  guest = await Guest.create({
    user: req.user._id,
    phone,
    address,
    emergencyContact,
    preferences
  });

  res.status(201).json(guest);
});

/**
 * @desc    Get my guest profile
 * @route   GET /api/guests/me
 * @access  Private (guest only)
 */
export const getMyGuestProfile = asyncHandler(async (req, res) => {
  const guest = await Guest.findOne({ user: req.user._id })
    .populate("user", "name email");

  if (!guest) {
    res.status(404);
    throw new Error("Guest profile not found");
  }

  res.json(guest);
});

/**
 * @desc    Get all guests
 * @route   GET /api/guests
 * @access  Private (staff/admin only)
 */
export const getAllGuests = asyncHandler(async (req, res) => {
  const guests = await Guest.find()
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  res.json(guests);
});

/**
 * @desc    Update guest profile
 * @route   PUT /api/guests/me
 * @access  Private (guest only)
 */
export const updateGuestProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("Guest not found");
  }

  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  if (req.body.password) {
    user.password = req.body.password;
  }

  const updatedUser = await user.save();

  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
  });
});

/**
 * @desc    Get guest bookings
 * @route   GET /api/guests/me/bookings
 * @access  Private (guest only)
 */
export const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ guest: req.user._id }).populate("room");
  res.json(bookings);
});

/**
 * @desc    Cancel a booking
 * @route   PUT /api/guests/me/bookings/:id/cancel
 * @access  Private (guest only)
 */
export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  if (booking.guest.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Not authorized to cancel this booking");
  }

  booking.status = "cancelled";
  await booking.save();

  res.json({ message: "Booking cancelled successfully" });
});
