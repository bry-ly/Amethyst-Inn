import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Room from '../models/Room.js';

// Load environment variables
dotenv.config();

// Room data from frontend
const roomsData = [
  {
    number: "101",
    type: "deluxe",
    pricePerNight: 150,
    images: ["https://images.unsplash.com/photo-1655292912612-bb5b1bda9355?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"],
    description: "Spacious king room with modern amenities and city view. Perfect for couples or business travelers.",
    capacity: { adults: 2, children: 0 },
    amenities: ["WiFi", "Coffee Machine", "Private Bathroom", "King Bed", "Parking"],
    size: 35,
    floor: 1,
    features: {
      hasBalcony: false,
      hasSeaView: false,
      hasKitchen: false,
      hasJacuzzi: false,
      isAccessible: true
    },
    status: "available"
  },
  {
    number: "201",
    type: "suite",
    pricePerNight: 250,
    images: ["https://images.unsplash.com/photo-1698870157085-11632d2ddef8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"],
    description: "Luxurious suite with separate living area, perfect for extended stays and special occasions.",
    capacity: { adults: 4, children: 0 },
    amenities: ["WiFi", "Coffee Machine", "Private Bathroom", "King Bed", "Parking"],
    size: 60,
    floor: 2,
    features: {
      hasBalcony: true,
      hasSeaView: false,
      hasKitchen: true,
      hasJacuzzi: false,
      isAccessible: true
    },
    status: "occupied"
  },
  {
    number: "301",
    type: "standard",
    pricePerNight: 100,
    images: ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"],
    description: "Comfortable standard room with all essential amenities for a pleasant stay.",
    capacity: { adults: 2, children: 0 },
    amenities: ["WiFi", "Private Bathroom", "Queen Bed"],
    size: 25,
    floor: 3,
    features: {
      hasBalcony: false,
      hasSeaView: false,
      hasKitchen: false,
      hasJacuzzi: false,
      isAccessible: true
    },
    status: "available"
  },
  {
    number: "401",
    type: "premium",
    pricePerNight: 200,
    images: ["https://images.unsplash.com/photo-1618773928121-c32242e63f39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"],
    description: "Premium room with enhanced amenities and stunning views.",
    capacity: { adults: 4, children: 2 },
    amenities: ["WiFi", "Coffee Machine", "Private Bathroom", "King Bed", "Parking", "Mini Bar"],
    size: 45,
    floor: 4,
    features: {
      hasBalcony: true,
      hasSeaView: true,
      hasKitchen: false,
      hasJacuzzi: true,
      isAccessible: true
    },
    status: "available"
  },
  {
    number: "501",
    type: "family",
    pricePerNight: 180,
    images: ["https://images.unsplash.com/photo-1595576508898-0ad5c879a061?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"],
    description: "Family-friendly room with extra space and amenities for children.",
    capacity: { adults: 2, children: 2 },
    amenities: ["WiFi", "Private Bathroom", "Queen Bed", "Sofa Bed", "Child Safety Features"],
    size: 40,
    floor: 5,
    features: {
      hasBalcony: false,
      hasSeaView: false,
      hasKitchen: true,
      hasJacuzzi: false,
      isAccessible: true
    },
    status: "available"
  }
];

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Seed rooms function
const seedRooms = async () => {
  try {
    console.log('Starting room seeding process...');
    
    let seededCount = 0;
    let updatedCount = 0;
    
    // Process each room individually to handle duplicates
    for (const roomData of roomsData) {
      try {
        // Try to find existing room by number
        const existingRoom = await Room.findOne({ number: roomData.number });
        
        if (existingRoom) {
          // Update existing room
          await Room.updateOne({ number: roomData.number }, roomData);
          updatedCount++;
          console.log(`Updated room ${roomData.number} (${roomData.type})`);
        } else {
          // Create new room
          const newRoom = new Room(roomData);
          await newRoom.save();
          seededCount++;
          console.log(`Created room ${roomData.number} (${roomData.type}) - ₱${roomData.pricePerNight}/night`);
        }
      } catch (roomError) {
        console.error(`Error processing room ${roomData.number}:`, roomError.message);
        // Continue with other rooms
      }
    }
    
    console.log(`Seeding completed: ${seededCount} new rooms, ${updatedCount} updated rooms`);
    return { seededCount, updatedCount };
  } catch (error) {
    console.error('Error seeding rooms:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    console.log('Starting room seeding...');
    await connectDB();
    console.log('Database connected, starting to seed rooms...');
    await seedRooms();
    console.log('Room seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Room seeding failed:', error);
    process.exit(1);
  }
};

// Run if called directly
main();

