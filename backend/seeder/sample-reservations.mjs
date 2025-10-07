import mongoose from "mongoose";
import dotenv from "dotenv";
import Reservation from "../models/Reservation.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import connectDB from "../config/db.js";

dotenv.config();

const createSampleReservations = async () => {
  try {
    await connectDB();

    // Get admin user
    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      console.log("❌ Admin user not found. Please run the seeder first to create an admin user.");
      process.exit(1);
    }

    // Get a sample room
    const room = await Room.findOne({ status: "available" });
    if (!room) {
      console.log("❌ No available rooms found. Please create some rooms first.");
      process.exit(1);
    }

    // Check if sample reservations already exist
    const existingReservations = await Reservation.countDocuments();
    if (existingReservations > 0) {
      console.log(`✅ ${existingReservations} reservations already exist in the database.`);
      process.exit();
    }

    // Create sample reservations
    const sampleReservations = [
      {
        guest: admin._id,
        room: room._id,
        checkInDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        checkOutDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
        guestCount: 2,
        totalPrice: 2000,
        status: "pending",
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours from now
      },
      {
        guest: admin._id,
        room: room._id,
        checkInDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        checkOutDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        guestCount: 1,
        totalPrice: 3000,
        status: "confirmed",
        depositPaid: true,
        depositAmount: 600,
        depositPaidAt: new Date()
      },
      {
        guest: admin._id,
        room: room._id,
        checkInDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
        checkOutDate: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000), // 16 days from now
        guestCount: 3,
        totalPrice: 2500,
        status: "cancelled",
        cancelledAt: new Date()
      }
    ];

    for (const reservationData of sampleReservations) {
      const reservation = await Reservation.create(reservationData);
      console.log(`✅ Created reservation: ${reservation._id} (${reservation.status})`);
    }

    console.log("🎉 Sample reservations created successfully!");
    process.exit();
  } catch (error) {
    console.error("❌ Error creating sample reservations:", error.message);
    process.exit(1);
  }
};

createSampleReservations();
