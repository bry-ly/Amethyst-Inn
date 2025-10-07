import asyncHandler from "express-async-handler";
import Reservation from "../models/Reservation.js";
import Booking from "../models/Booking.js";
import Room from "../models/Room.js";

// @desc    Create new reservation
// @route   POST /api/reservations
// @access  Private
export const createReservation = asyncHandler(async (req, res) => {
  const { 
    roomId, 
    checkInDate, 
    checkOutDate, 
    guestCount, 
    totalPrice, 
    specialRequests,
    paymentMethod,
    paymentReference
  } = req.body;

  // Validate required fields
  if (!roomId || !checkInDate || !checkOutDate || !guestCount || !totalPrice) {
    res.status(400);
    throw new Error("Missing required fields: roomId, checkInDate, checkOutDate, guestCount, totalPrice");
  }

  // Validate identification document upload
  if (!req.file) {
    res.status(400);
    throw new Error("Identification document is required for reservation verification");
  }

  // Validate guest count
  const guests = parseInt(guestCount);
  if (isNaN(guests) || guests < 1) {
    res.status(400);
    throw new Error("At least 1 guest is required");
  }

  if (guests > 20) {
    res.status(400);
    throw new Error("Cannot exceed 20 guests");
  }

  // Validate dates
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (checkIn < today) {
    res.status(400);
    throw new Error("Check-in date cannot be in the past");
  }

  if (checkOut <= checkIn) {
    res.status(400);
    throw new Error("Check-out date must be after check-in date");
  }

  // Find room and validate
  const room = await Room.findById(roomId);
  if (!room) {
    res.status(404);
    throw new Error("Room not found");
  }

  if (room.status !== "available") {
    res.status(400);
    throw new Error("Room is not available for reservation");
  }

  // Check room capacity
  const roomCapacity = room.guestCapacity || (room.capacity?.adults + room.capacity?.children) || 2;
  if (guests > roomCapacity) {
    res.status(400);
    throw new Error(`Room capacity exceeded. Maximum ${roomCapacity} guests allowed`);
  }

  // Check for overlapping reservations and bookings
  const overlappingReservations = await Reservation.findOverlapping(roomId, checkInDate, checkOutDate);
  const overlappingBookings = await Booking.findOverlapping(roomId, checkInDate, checkOutDate);
  
  if (overlappingReservations.length > 0 || overlappingBookings.length > 0) {
    res.status(400);
    throw new Error("Room is already reserved or booked for the selected dates");
  }

  // Calculate deposit amount (20% of total)
  const depositAmount = Math.round(totalPrice * 0.2);

  // Create reservation
  const reservation = await Reservation.create({
    guest: req.user._id,
    room: roomId,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    guestCount: guests,
    totalPrice,
    specialRequests: specialRequests || undefined,
    identificationDocument: req.uploadedDocument._id, // Use document reference instead of file path
    depositAmount,
    paymentMethod: paymentMethod || undefined,
    paymentReference: paymentReference || undefined,
    status: "pending",
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) // Set expiry to 48 hours from now
  });

  // Populate the reservation for response
  await reservation.populate([
    { path: 'room', select: 'number type pricePerNight capacity amenities' },
    { path: 'guest', select: 'name email phone' },
    { path: 'identificationDocument', select: 'filename originalName mimetype size url' }
  ]);

  res.status(201).json({ 
    success: true,
    message: "Reservation created successfully. Please pay the deposit within 48 hours to confirm.",
    data: reservation,
    depositRequired: depositAmount,
    expiresAt: reservation.expiresAt
  });
});

// @desc    Get all reservations (user's own or all for staff/admin)
// @route   GET /api/reservations
// @access  Private
export const getReservations = asyncHandler(async (req, res) => {
  let query = {};

  // If user is not staff or admin, only show their own reservations
  if (req.user.role !== "staff" && req.user.role !== "admin") {
    query.guest = req.user._id;
  }

  // Filter by status if provided
  if (req.query.status) {
    query.status = req.query.status;
  }

  const reservations = await Reservation.find(query)
    .populate("room", "number type pricePerNight capacity amenities")
    .populate("guest", "name email phone")
    .populate("identificationDocument", "filename originalName mimetype size url")
    .sort({ createdAt: -1 });

  res.json({ 
    success: true,
    count: reservations.length,
    data: reservations 
  });
});

// @desc    Get single reservation
// @route   GET /api/reservations/:id
// @access  Private
export const getReservationById = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id)
    .populate("room", "number type pricePerNight capacity amenities images")
    .populate("guest", "name email phone")
    .populate("identificationDocument", "filename originalName mimetype size url path");

  if (!reservation) {
    res.status(404);
    throw new Error("Reservation not found");
  }

  // Check if user is authorized to view this reservation
  if (
    req.user.role !== "staff" &&
    req.user.role !== "admin" &&
    reservation.guest._id.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to view this reservation");
  }

  res.json({ 
    success: true,
    data: reservation 
  });
});

// @desc    Confirm reservation (pay deposit)
// @route   PUT /api/reservations/:id/confirm
// @access  Private
export const confirmReservation = asyncHandler(async (req, res) => {
  const { paymentMethod, paymentReference } = req.body;
  
  const reservation = await Reservation.findById(req.params.id).populate("room");

  if (!reservation) {
    res.status(404);
    throw new Error("Reservation not found");
  }

  // Check if user owns this reservation or is staff/admin
  if (
    req.user.role !== "staff" &&
    req.user.role !== "admin" &&
    reservation.guest.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to confirm this reservation");
  }

  // Check if already confirmed
  if (reservation.status === "confirmed") {
    res.status(400);
    throw new Error("Reservation is already confirmed");
  }

  // Check if expired
  if (new Date() > reservation.expiresAt && reservation.status === "pending") {
    reservation.status = "expired";
    await reservation.save();
    res.status(400);
    throw new Error("Reservation has expired. Please create a new reservation.");
  }

  // Check if cancelled
  if (reservation.status === "cancelled") {
    res.status(400);
    throw new Error("Cannot confirm a cancelled reservation");
  }

  // Update reservation
  reservation.status = "confirmed";
  reservation.depositPaid = true;
  reservation.depositPaidAt = new Date();
  
  if (paymentMethod) {
    reservation.paymentMethod = paymentMethod;
  }
  
  if (paymentReference) {
    reservation.paymentReference = paymentReference;
  }

  await reservation.save();

  res.json({ 
    success: true,
    message: "Reservation confirmed successfully",
    data: reservation
  });
});

// @desc    Cancel reservation
// @route   PUT /api/reservations/:id/cancel
// @access  Private
export const cancelReservation = asyncHandler(async (req, res) => {
  const { cancellationReason } = req.body;
  
  const reservation = await Reservation.findById(req.params.id).populate("room");

  if (!reservation) {
    res.status(404);
    throw new Error("Reservation not found");
  }

  // Check if user owns this reservation
  if (reservation.guest.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to cancel this reservation");
  }

  // Check if already cancelled
  if (reservation.status === "cancelled") {
    res.status(400);
    throw new Error("Reservation is already cancelled");
  }

  // Check if already converted to booking
  if (reservation.status === "converted_to_booking") {
    res.status(400);
    throw new Error("Cannot cancel a reservation that has been converted to a booking");
  }

  // Update reservation
  reservation.status = "cancelled";
  reservation.cancelledAt = new Date();
  reservation.cancelledBy = req.user._id;
  
  if (cancellationReason) {
    reservation.cancellationReason = cancellationReason;
  }

  await reservation.save();

  // Calculate refund (full deposit if cancelled before confirmation)
  const refundAmount = reservation.depositPaid ? reservation.depositAmount : 0;

  res.json({ 
    success: true,
    message: "Reservation cancelled successfully",
    data: {
      reservation,
      refundAmount,
      refundEligible: refundAmount > 0
    }
  });
});

// @desc    Convert reservation to booking
// @route   POST /api/reservations/:id/convert
// @access  Private/Staff/Admin
export const convertToBooking = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id).populate("room");

  if (!reservation) {
    res.status(404);
    throw new Error("Reservation not found");
  }

  // Only confirmed reservations can be converted
  if (reservation.status !== "confirmed") {
    res.status(400);
    throw new Error("Only confirmed reservations can be converted to bookings");
  }

  // Check if already converted
  if (reservation.convertedToBooking) {
    res.status(400);
    throw new Error("Reservation has already been converted to a booking");
  }

  // Create booking from reservation
  const booking = await Booking.create({
    guest: reservation.guest,
    room: reservation.room._id,
    checkInDate: reservation.checkInDate,
    checkOutDate: reservation.checkOutDate,
    guestCount: reservation.guestCount,
    totalPrice: reservation.totalPrice,
    specialRequests: reservation.specialRequests,
    identificationDocument: reservation.identificationDocument._id, // Use document reference
    status: "confirmed",
    isPaid: false, // Remaining balance needs to be paid
    paymentMethod: reservation.paymentMethod,
    paymentReference: reservation.paymentReference,
  });

  // Update reservation
  reservation.status = "converted_to_booking";
  reservation.convertedToBooking = booking._id;
  await reservation.save();

  // Populate booking
  await booking.populate([
    { path: 'room', select: 'number type pricePerNight capacity amenities' },
    { path: 'guest', select: 'name email phone' }
  ]);

  res.json({ 
    success: true,
    message: "Reservation converted to booking successfully",
    data: {
      reservation,
      booking
    }
  });
});

// @desc    Delete reservation
// @route   DELETE /api/reservations/:id
// @access  Private
export const deleteReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);

  if (!reservation) {
    res.status(404);
    throw new Error("Reservation not found");
  }

  // Check authorization
  if (
    req.user.role !== "admin" &&
    reservation.guest.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to delete this reservation");
  }

  await reservation.deleteOne();

  res.json({ 
    success: true,
    message: "Reservation deleted successfully" 
  });
});
