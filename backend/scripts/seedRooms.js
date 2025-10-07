import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Room from '../models/Room.js';

// Resolve project paths for environment loading
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env regardless of cwd
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const cleanupIndexes = async () => {
  try {
    const indexes = await Room.collection.indexes();
    const legacyIdIndex = indexes.find((index) => index.name === 'id_1');
    if (legacyIdIndex) {
      await Room.collection.dropIndex('id_1');
      console.log('Removed legacy id_1 index to prevent duplicate key errors.');
    }
  } catch (error) {
    // NamespaceNotFound (code 26) occurs when collection hasn't been created yet
    if (error.code === 26) {
      console.log('Room collection not found when cleaning indexes; continuing.');
    } else {
      console.warn('Failed to clean up legacy indexes:', error.message);
    }
  }
};

// Room data from frontend
const roomsData = [
  {
    number: "RM-101",
    type: "deluxe",
    pricePerNight: 150,
    images: [
      "https://images.unsplash.com/photo-1655292912612-bb5b1bda9355?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
    ],
    description:
      "Spacious king room with modern amenities and city view. Perfect for couples or business travelers.",
    capacity: { adults: 2, children: 0 },
    amenities: ["WiFi", "Coffee Machine", "Private Bathroom", "King Bed", "Parking"],
    size: 33,
    floor: 1,
    features: {
      hasBalcony: false,
      hasSeaView: false,
      hasKitchen: false,
      hasJacuzzi: false,
      isAccessible: true
    },
    status: "available",
    isActive: true
  },
  {
    number: "RM-102",
    type: "suite",
    pricePerNight: 250,
    images: [
      "https://images.unsplash.com/photo-1698870157085-11632d2ddef8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
    ],
    description:
      "Luxurious suite with separate living area, perfect for extended stays and special occasions.",
    capacity: { adults: 4, children: 0 },
    amenities: ["WiFi", "Coffee Machine", "Private Bathroom", "King Bed", "Parking"],
    size: 56,
    floor: 2,
    features: {
      hasBalcony: false,
      hasSeaView: false,
      hasKitchen: false,
      hasJacuzzi: false,
      isAccessible: true
    },
    status: "occupied",
    isActive: true
  },
  {
    number: "RM-103",
    type: "standard",
    pricePerNight: 120,
    images: [
      "https://images.unsplash.com/photo-1729605411476-defbdab14c54?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
    ],
    description: "Comfortable queen room with all essential amenities for a pleasant stay.",
    capacity: { adults: 2, children: 0 },
    amenities: ["WiFi", "Coffee Machine", "Private Bathroom", "Queen Bed"],
    size: 28,
    floor: 3,
    features: {
      hasBalcony: false,
      hasSeaView: false,
      hasKitchen: false,
      hasJacuzzi: false,
      isAccessible: true
    },
    status: "available",
    isActive: true
  },
  {
    number: "RM-104",
    type: "family",
    pricePerNight: 200,
    images: [
      "https://images.unsplash.com/photo-1654243397456-73da481a623e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
    ],
    description:
      "Spacious family room with multiple beds, ideal for families traveling together.",
    capacity: { adults: 4, children: 0 },
    amenities: [
      "WiFi",
      "Coffee Machine",
      "Private Bathroom",
      "Twin Beds",
      "Parking"
    ],
    size: 42,
    floor: 4,
    features: {
      hasBalcony: false,
      hasSeaView: false,
      hasKitchen: false,
      hasJacuzzi: false,
      isAccessible: true
    },
    status: "available",
    isActive: true
  },
  {
    number: "RM-105",
    type: "premium",
    pricePerNight: 180,
    images: [
      "https://images.unsplash.com/photo-1678924133506-7508daa13c7c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
    ],
    description:
      "Premium room featuring upgraded amenities and elegant bathroom with modern fixtures.",
    capacity: { adults: 2, children: 0 },
    amenities: ["WiFi", "Coffee Machine", "Private Bathroom", "King Bed", "Parking"],
    size: 37,
    floor: 5,
    features: {
      hasBalcony: false,
      hasSeaView: false,
      hasKitchen: false,
      hasJacuzzi: false,
      isAccessible: true
    },
    status: "occupied",
    isActive: true
  },
  {
    number: "RM-106",
    type: "standard",
    pricePerNight: 130,
    images: [
      "https://images.unsplash.com/photo-1697535199809-95583d780900?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
    ],
    description:
      "Peaceful room overlooking our beautiful garden, perfect for relaxation and tranquility.",
    capacity: { adults: 2, children: 0 },
    amenities: ["WiFi", "Coffee Machine", "Private Bathroom", "Queen Bed"],
    size: 30,
    floor: 6,
    features: {
      hasBalcony: false,
      hasSeaView: false,
      hasKitchen: false,
      hasJacuzzi: false,
      isAccessible: true
    },
    status: "available",
    isActive: true
  },
  {
    number: "RM-107",
    type: "standard",
    pricePerNight: 110,
    images: [
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
    ],
    description: "Comfortable twin room ideal for friends or colleagues traveling together.",
    capacity: { adults: 2, children: 0 },
    amenities: ["WiFi", "Private Bathroom", "Twin Beds", "Parking"],
    size: 300,
    floor: 7,
    features: {
      hasBalcony: false,
      hasSeaView: false,
      hasKitchen: false,
      hasJacuzzi: false,
      isAccessible: true
    },
    status: "occupied",
    isActive: true
  },
  {
    number: "RM-108",
    type: "suite",
    pricePerNight: 280,
    images: [
      "https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
    ],
    description:
      "Spacious suite with lounge area and balcony offering refreshing breezes.",
    capacity: { adults: 4, children: 0 },
    amenities: [
      "WiFi",
      "Coffee Machine",
      "Private Bathroom",
      "King Bed",
      "Parking",
      "Balcony"
    ],
    size: 60,
    floor: 8,
    features: {
      hasBalcony: true,
      hasSeaView: false,
      hasKitchen: false,
      hasJacuzzi: false,
      isAccessible: true
    },
    status: "available",
    isActive: true
  },
  {
    number: "RM-109",
    type: "premium",
    pricePerNight: 170,
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
    ],
    description:
      "Elegant queen room with premium linens and a workspace for productivity.",
    capacity: { adults: 2, children: 0 },
    amenities: [
      "WiFi",
      "Coffee Machine",
      "Private Bathroom",
      "Queen Bed",
      "Parking",
      "Work Desk"
    ],
    size: 35,
    floor: 9,
    features: {
      hasBalcony: false,
      hasSeaView: false,
      hasKitchen: false,
      hasJacuzzi: false,
      isAccessible: true
    },
    status: "available",
    isActive: true
  },
  {
    number: "RM-110",
    type: "suite",
    pricePerNight: 10000,
    images: [
      "https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
    ],
    description:
      "Suite with large tv with gaming console also have a personal computer",
    capacity: { adults: 10, children: 5 },
    amenities: [
      "WiFi",
      "Coffee Machine",
      "Private Bathroom",
      "Couch",
      "Tv with gaming console"
    ],
    size: 93,
    floor: 10,
    features: {
      hasBalcony: false,
      hasSeaView: false,
      hasKitchen: false,
      hasJacuzzi: false,
      isAccessible: true
    },
    status: "available",
    isActive: true
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

const shouldReset = process.argv.includes('--reset');

// Seed rooms function
const seedRooms = async () => {
  try {
    console.log('Starting room seeding process...');
    if (shouldReset) {
      console.log('Reset flag detected -- clearing existing rooms...');
      const deleteResult = await Room.deleteMany({});
      console.log(`Removed ${deleteResult.deletedCount} existing room(s).`);
    }
    
    let seededCount = 0;
    let updatedCount = 0;
    const errorDetails = [];
    
    // Process each room individually to handle duplicates
    for (const roomData of roomsData) {
      try {
        const normalizedNumber = roomData.number.trim().toUpperCase();
        const normalizedData = {
          ...roomData,
          number: normalizedNumber,
        };

        delete normalizedData.id;
        delete normalizedData._id;

        const result = await Room.updateOne(
          { number: normalizedNumber },
          { $set: normalizedData },
          { upsert: true, runValidators: true }
        );

        if (result.upsertedCount && result.upsertedCount > 0) {
          seededCount++;
          console.log(
            `Created room ${normalizedNumber} (${roomData.type}) - ₱${roomData.pricePerNight}/night`
          );
        } else if (result.modifiedCount > 0) {
          updatedCount++;
          console.log(`Updated room ${normalizedNumber} (${roomData.type})`);
        } else {
          console.log(`No changes needed for room ${normalizedNumber} (${roomData.type})`);
        }
      } catch (roomError) {
        console.error(`Error processing room ${roomData.number}:`, roomError.message);
        errorDetails.push({ number: roomData.number, error: roomError.message });
        // Continue with other rooms
      }
    }
    
    console.log(`Seeding completed: ${seededCount} new rooms, ${updatedCount} updated rooms`);
    const totalRooms = await Room.countDocuments();
    console.log(`Current room count: ${totalRooms}`);
    if (errorDetails.length > 0) {
      console.log('Encountered the following errors:');
      errorDetails.forEach((detail) => {
        console.log(` - ${detail.number}: ${detail.error}`);
      });
    }
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
    await cleanupIndexes();
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

