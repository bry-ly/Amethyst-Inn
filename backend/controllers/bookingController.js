// controllers/bookingController.js
import asyncHandler from "express-async-handler";
import Booking from "../models/Booking.js";
import Room from "../models/Room.js";

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
export const createBooking = asyncHandler(async (req, res) => {
  const { 
    roomId, 
    checkInDate, 
    checkOutDate, 
    guests, 
    totalPrice, 
    specialRequests 
  } = req.body;

  // Validate required fields
  if (!roomId || !checkInDate || !checkOutDate || !guests || !totalPrice) {
    res.status(400);
    throw new Error("Missing required fields: roomId, checkInDate, checkOutDate, guests, totalPrice");
  }

  // Validate guests structure
  if (!guests.adults || guests.adults < 1) {
    res.status(400);
    throw new Error("At least 1 adult is required");
  }

  if (guests.adults > 10) {
    res.status(400);
    throw new Error("Cannot exceed 10 adults");
  }

  if (guests.children && guests.children > 5) {
    res.status(400);
    throw new Error("Cannot exceed 5 children");
  }

  // Validate dates
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const now = new Date();

  if (checkIn <= now) {
    res.status(400);
    throw new Error("Check-in date must be in the future");
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
    throw new Error("Room is not available for booking");
  }

  // Check room capacity
  const totalGuests = guests.adults + (guests.children || 0);
  if (totalGuests > (room.capacity.adults + room.capacity.children)) {
    res.status(400);
    throw new Error(`Room capacity exceeded. Maximum ${room.capacity.adults + room.capacity.children} guests allowed`);
  }

  // Check for overlapping bookings using the schema method
  const overlappingBookings = await Booking.findOverlapping(roomId, checkInDate, checkOutDate);
  
  if (overlappingBookings.length > 0) {
    res.status(400);
    throw new Error("Room is already booked for the selected dates");
  }

  // Create booking with all schema fields
  const booking = await Booking.create({
    guest: req.user._id,
    room: roomId,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    guests: {
      adults: guests.adults,
      children: guests.children || 0
    },
    totalPrice,
    specialRequests: specialRequests || undefined,
    status: "pending", // Start as pending, can be confirmed later
    isPaid: false,
    // Payment fields will be handled separately
  });

  // Populate the booking for response
  await booking.populate([
    { path: 'room', select: 'number type pricePerNight capacity amenities' },
    { path: 'guest', select: 'name email phone' }
  ]);

  res.status(201).json({
    success: true,
    message: "Booking created successfully",
    data: booking
  });
});


// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private/Admin/Staff
export const updateBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate("room");

  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  // Validate status transitions
  const validStatuses = ["pending", "confirmed", "cancelled", "completed", "no_show", "checked_in", "checked_out"];
  if (req.body.status && !validStatuses.includes(req.body.status)) {
    res.status(400);
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
  }

  // Update booking fields
  if (req.body.status) {
    const oldStatus = booking.status;
    booking.status = req.body.status;
    
    // Handle status-specific logic
    if (req.body.status === "cancelled" && oldStatus !== "cancelled") {
      booking.cancelledAt = new Date();
      booking.cancelledBy = req.user._id;
      if (req.body.cancellationReason) {
        booking.cancellationReason = req.body.cancellationReason;
      }
    }
    
    if (req.body.status === "checked_in" && oldStatus !== "checked_in") {
      booking.checkedInAt = new Date();
      booking.checkedInBy = req.user._id;
    }
    
    if (req.body.status === "checked_out" && oldStatus !== "checked_out") {
      booking.checkedOutAt = new Date();
      booking.checkedOutBy = req.user._id;
    }
  }

  // Update payment information
  if (req.body.isPaid !== undefined) {
    booking.isPaid = req.body.isPaid;
    if (req.body.isPaid && !booking.paidAt) {
      booking.paidAt = new Date();
    }
  }

  if (req.body.paymentMethod) {
    booking.paymentMethod = req.body.paymentMethod;
  }

  if (req.body.paymentReference) {
    booking.paymentReference = req.body.paymentReference;
  }

  // Update special requests
  if (req.body.specialRequests !== undefined) {
    booking.specialRequests = req.body.specialRequests;
  }

  // Update internal notes
  if (req.body.internalNotes) {
    booking.internalNotes.push({
      note: req.body.internalNotes,
      staff: req.user._id
    });
  }

  await booking.save();

  // Update room status based on booking status
  if (booking.status === "cancelled" || booking.status === "completed" || booking.status === "checked_out") {
    booking.room.status = "available";
    await booking.room.save();
  } else if (booking.status === "confirmed" || booking.status === "checked_in") {
    booking.room.status = "occupied";
    await booking.room.save();
  }

  // Populate the updated booking
  await booking.populate([
    { path: 'room', select: 'number type pricePerNight capacity amenities' },
    { path: 'guest', select: 'name email phone' }
  ]);

  res.json({
    success: true,
    message: "Booking updated successfully",
    data: booking
  });
});

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private/Admin/Staff
export const getBookings = asyncHandler(async (req, res) => {
  let query = {};
  
  // If user is a guest, only show their bookings
  if (req.user.role === "guest") {
    query.guest = req.user._id;
  }

  // Add filtering options
  if (req.query.status) {
    query.status = req.query.status;
  }

  if (req.query.room) {
    query.room = req.query.room;
  }

  if (req.query.checkInDate) {
    query.checkInDate = { $gte: new Date(req.query.checkInDate) };
  }

  if (req.query.checkOutDate) {
    query.checkOutDate = { $lte: new Date(req.query.checkOutDate) };
  }

  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Sorting
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

  const bookings = await Booking.find(query)
    .populate("room", "number type pricePerNight capacity amenities status")
    .populate("guest", "name email phone")
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit);

  const total = await Booking.countDocuments(query);

  res.json({
    success: true,
    data: bookings,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private/Admin/Staff
export const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate("room", "number type pricePerNight capacity amenities status")
    .populate("guest", "name email phone")
    .populate("cancelledBy", "name email")
    .populate("checkedInBy", "name email")
    .populate("checkedOutBy", "name email")
    .populate("internalNotes.staff", "name email");

  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  // Check if guest is trying to access their own booking
  if (req.user.role === "guest" && booking.guest._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to view this booking");
  }

  res.json({
    success: true,
    data: booking
  });
});

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private/Guest
export const cancelBooking = asyncHandler(async (req, res) => {
  const { cancellationReason } = req.body;
  
  const booking = await Booking.findById(req.params.id).populate("room");

  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  // Check if guest is trying to cancel their own booking
  if (booking.guest.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to cancel this booking");
  }

  // Check if booking can be cancelled
  if (booking.status === "cancelled") {
    res.status(400);
    throw new Error("Booking is already cancelled");
  }

  if (booking.status === "completed") {
    res.status(400);
    throw new Error("Cannot cancel a completed booking");
  }

  if (booking.status === "checked_out") {
    res.status(400);
    throw new Error("Cannot cancel a checked-out booking");
  }

  // Check if booking can be cancelled based on check-in time
  const now = new Date();
  const hoursUntilCheckIn = (booking.checkInDate - now) / (1000 * 60 * 60);
  
  if (hoursUntilCheckIn < 0) {
    res.status(400);
    throw new Error("Cannot cancel a booking that has already started");
  }

  // Update booking status and cancellation details
  booking.status = "cancelled";
  booking.cancelledAt = new Date();
  booking.cancelledBy = req.user._id;
  
  if (cancellationReason) {
    booking.cancellationReason = cancellationReason;
  }

  await booking.save();

  // Update room status to available
  booking.room.status = "available";
  await booking.room.save();

  // Calculate refund amount
  const refundAmount = booking.calculateRefund();

  res.json({ 
    success: true,
    message: "Booking cancelled successfully", 
    data: {
      booking,
      refundAmount,
      refundEligible: refundAmount > 0
    }
  });
});

// @desc    Check in guest
// @route   PUT /api/bookings/:id/checkin
// @access  Private/Staff/Admin
export const checkInGuest = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate("room");

  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  if (booking.status !== "confirmed") {
    res.status(400);
    throw new Error("Only confirmed bookings can be checked in");
  }

  // Update booking status
  booking.status = "checked_in";
  booking.checkedInAt = new Date();
  booking.checkedInBy = req.user._id;

  await booking.save();

  // Update room status
  booking.room.status = "occupied";
  await booking.room.save();

  res.json({
    success: true,
    message: "Guest checked in successfully",
    data: booking
  });
});

// @desc    Check out guest
// @route   PUT /api/bookings/:id/checkout
// @access  Private/Staff/Admin
export const checkOutGuest = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate("room");

  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }

  if (booking.status !== "checked_in") {
    res.status(400);
    throw new Error("Only checked-in bookings can be checked out");
  }

  // Update booking status
  booking.status = "checked_out";
  booking.checkedOutAt = new Date();
  booking.checkedOutBy = req.user._id;

  await booking.save();

  // Update room status
  booking.room.status = "available";
  await booking.room.save();

  res.json({
    success: true,
    message: "Guest checked out successfully",
    data: booking
  });
});

// @desc    Get booking statistics
// @route   GET /api/bookings/stats
// @access  Private/Admin/Manager
export const getBookingStats = asyncHandler(async (req, res) => {
  const stats = await Booking.getStats();

  // Get additional stats
  const totalBookings = await Booking.countDocuments();
  const confirmedBookings = await Booking.countDocuments({ status: "confirmed" });
  const cancelledBookings = await Booking.countDocuments({ status: "cancelled" });
  const completedBookings = await Booking.countDocuments({ status: "completed" });

  res.json({
    success: true,
    data: {
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      completedBookings,
      ...stats[0] // Aggregate stats from schema method
    }
  });
});