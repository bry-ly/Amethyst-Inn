import express from "express";
import authRoutes from "./authRoutes.js";
import userRoutes from "./usersRoutes.js";
import roomRoutes from "./roomRoutes.js";
import bookingRoutes from "./bookingRoutes.js";
import paymentRoutes from "./paymentRoutes.js";
import guestRoutes from "./guestRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/rooms", roomRoutes);
router.use("/bookings", bookingRoutes);
router.use("/payments", paymentRoutes);
router.use("/guests", guestRoutes);

export default router;
