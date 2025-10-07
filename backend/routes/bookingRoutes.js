import express from "express";
import {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
} from "../controllers/bookingController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Guest can create bookings
router.post("/", protect, authorizeRoles("guest"), createBooking);

// Guest sees their own bookings
router.get("/my", protect, authorizeRoles("guest"), getBookings);

// Staff/Admin can see all bookings
router.get("/", protect, authorizeRoles("staff", "admin"), getBookings);

// Staff/Admin can view single booking
router.get("/:id", protect, authorizeRoles("staff", "admin"), getBookingById);

// Staff/Admin can update booking (status, payment)
router.put("/:id", protect, authorizeRoles("staff", "admin"), updateBooking);

// Guest can cancel own booking
router.put("/:id/cancel", protect, authorizeRoles("guest"), cancelBooking);

export default router;
