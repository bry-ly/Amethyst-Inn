import asyncHandler from "express-async-handler";
import Room from "../models/Room.js";
import logger from "../utils/logger.js";

// @desc    Create a room
// @route   POST /api/rooms
// @access  Admin
export const createRoom = asyncHandler(async (req, res) => {
  const { 
    number, 
    type, 
    pricePerNight, 
    description, 
    amenities, 
    capacity,
    size,
    floor,
    features,
    images
  } = req.body;

  // Validate required fields
  if (!number || !type || !pricePerNight || !capacity) {
    res.status(400);
    throw new Error("Missing required fields: number, type, pricePerNight, capacity");
  }

  // Check if room number already exists
  const roomExists = await Room.findOne({ number: number.toUpperCase() });
  if (roomExists) {
    res.status(400);
    throw new Error("Room number already exists");
  }

  // Validate capacity
  if (!capacity.adults || capacity.adults < 1) {
    res.status(400);
    throw new Error("Adult capacity must be at least 1");
  }

  if (capacity.children && capacity.children > capacity.adults) {
    res.status(400);
    throw new Error("Children capacity cannot exceed adult capacity");
  }

  // Create room with all provided fields
  const roomData = {
    number: number.toUpperCase(),
    type,
    pricePerNight,
    description: description || undefined,
    amenities: amenities || [],
    capacity: {
      adults: capacity.adults,
      children: capacity.children || 0
    },
    size: size || undefined,
    floor: floor || undefined,
    features: {
      hasBalcony: features?.hasBalcony || false,
      hasSeaView: features?.hasSeaView || false,
      hasKitchen: features?.hasKitchen || false,
      hasJacuzzi: features?.hasJacuzzi || false,
      isAccessible: features?.isAccessible || false
    },
    images: images || [],
    status: "available",
    isActive: true
  };

  const room = await Room.create(roomData);

  res.status(201).json({
    success: true,
    message: "Room created successfully",
    data: room
  });
});

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Public
export const getRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.find().sort({ number: 1 });
  res.json({
    success: true,
    data: rooms
  });
});

// @desc    Get a single room
// @route   GET /api/rooms/:id
// @access  Public
export const getRoomById = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);

  if (!room) {
    res.status(404);
    throw new Error("Room not found");
  }

  res.json({
    success: true,
    data: room
  });
});

// @desc    Update room details
// @route   PUT /api/rooms/:id
// @access  Admin
export const updateRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);

  if (!room) {
    res.status(404);
    throw new Error("Room not found");
  }

  room.number = req.body.number || room.number;
  room.image = req.body.image || room.image;
  room.type = req.body.type || room.type;
  room.pricePerNight = req.body.pricePerNight || room.pricePerNight;
  room.status = req.body.status || room.status;
  room.description = req.body.description || room.description;
  room.amenities = req.body.amenities || room.amenities;

  const updatedRoom = await room.save();
  res.json(updatedRoom);
});

// @desc    Delete a room
// @route   DELETE /api/rooms/:id
// @access  Admin
export const deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);

  if (!room) {
    res.status(404);
    throw new Error("Room not found");
  }

  await room.deleteOne();
  res.json({ message: "Room removed" });
});
