import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import connectDB from "../config/db.js";

dotenv.config();


const createAdmin = async () => {
  try {
    await connectDB();
    const adminExists = await User.findOne({ email: "amethystinnadmin@gmail.com" });

    if (adminExists) {
      console.log("✅ Admin already exists:", adminExists.email);
      process.exit();
    }

    const admin = await User.create({
      name: "Amethyst Admin",
      email: "amethystinnadmin@gmail.com",
      password: "amethystinnadmin2025", // auto-hashed by User model pre-save hook
      role: "admin",
    });

    console.log("✅ Admin created:", admin.email);
    process.exit();
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
    process.exit(1);
  }
};

createAdmin();
