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
    guestCapacity,
    size,
    floor,
    features,
    images
  } = req.body;

  // Validate required fields
  if (!number || !type || !pricePerNight || (!capacity && typeof guestCapacity !== 'number')) {
    res.status(400);
    throw new Error("Missing required fields: number, type, pricePerNight, and either capacity or guestCapacity");
  }

  // Check if room number already exists
  const roomExists = await Room.findOne({ number: number.toUpperCase() });
  if (roomExists) {
    res.status(400);
    throw new Error("Room number already exists");
  }

  // Validate capacity/guestCapacity
  if (typeof guestCapacity === 'number') {
    if (guestCapacity < 1) {
      res.status(400);
      throw new Error("Guest capacity must be at least 1");
    }
  } else {
    if (!capacity?.adults || capacity.adults < 1) {
      res.status(400);
      throw new Error("Adult capacity must be at least 1");
    }
    if (capacity.children && capacity.children > capacity.adults) {
      res.status(400);
      throw new Error("Children capacity cannot exceed adult capacity");
    }
  }

  // Create room with all provided fields
  const computedCapacity = typeof guestCapacity === 'number'
    ? { adults: guestCapacity, children: 0 }
    : {
        adults: capacity.adults,
        children: capacity.children || 0,
      };

  const finalGuestCapacity = typeof guestCapacity === 'number'
    ? guestCapacity
    : (computedCapacity.adults + computedCapacity.children);

  const roomData = {
    number: number.toUpperCase(),
    type,
    pricePerNight,
    description: description || undefined,
    amenities: amenities || [],
    capacity: computedCapacity,
    guestCapacity: finalGuestCapacity,
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

  try {
    const room = await Room.create(roomData);

    res.status(201).json({
      success: true,
      message: "Room created successfully",
      data: room
    });
  } catch (error) {
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      res.status(400);
      throw new Error(`Room number ${number.toUpperCase()} already exists in the database`);
    }
    // Re-throw other errors
    throw error;
  }
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

  if (req.body.number) {
    room.number = req.body.number.toUpperCase();
  }

  room.type = req.body.type || room.type;
  room.pricePerNight = req.body.pricePerNight ?? room.pricePerNight;
  room.status = req.body.status || room.status;
  room.description = req.body.description ?? room.description;
  room.amenities = req.body.amenities ?? room.amenities;
  room.images = req.body.images ?? room.images;

  if (req.body.capacity) {
    room.capacity = {
      adults: req.body.capacity.adults ?? room.capacity.adults,
      children: req.body.capacity.children ?? room.capacity.children,
    };
    // Maintain guestCapacity in sync
    room.guestCapacity = (room.capacity?.adults || 0) + (room.capacity?.children || 0);
  }

  if (typeof req.body.guestCapacity === 'number') {
    const gc = req.body.guestCapacity;
    if (gc < 1) {
      res.status(400);
      throw new Error("Guest capacity must be at least 1");
    }
    room.guestCapacity = gc;
    // Also reflect in capacity for backward compatibility
    room.capacity = {
      adults: gc,
      children: 0,
    };
  }

  if (req.body.features) {
    room.features = {
      hasBalcony: req.body.features.hasBalcony ?? room.features.hasBalcony,
      hasSeaView: req.body.features.hasSeaView ?? room.features.hasSeaView,
      hasKitchen: req.body.features.hasKitchen ?? room.features.hasKitchen,
      hasJacuzzi: req.body.features.hasJacuzzi ?? room.features.hasJacuzzi,
      isAccessible: req.body.features.isAccessible ?? room.features.isAccessible,
    };
  }

  if (req.body.size !== undefined) {
    room.size = req.body.size;
  }

  if (req.body.floor !== undefined) {
    room.floor = req.body.floor;
  }

  if (req.body.isActive !== undefined) {
    room.isActive = req.body.isActive;
  }

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
