import express from "express";
import {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  deleteBooking,
} from "../controllers/bookingController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { uploadIdentification, handleUploadError, saveUploadedFiles } from "../middleware/uploadMiddleware.js";
import {
  bookingCreationLimiter,
  bookingMutationLimiter,
} from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

// Any authenticated user can create bookings (with file upload)
router.post(
  "/",
  protect,
  bookingCreationLimiter,
  uploadIdentification,
  handleUploadError,
  saveUploadedFiles,
  createBooking
);

// Any authenticated user can see their own bookings, staff/admin see all
router.get("/", protect, getBookings);

// Staff/Admin can view single booking, guests can view their own
router.get("/:id", protect, getBookingById);

// Staff/Admin can update booking (status, payment), guests can confirm their own bookings
router.put("/:id", protect, bookingMutationLimiter, updateBooking);

// Any authenticated user can cancel their own booking
router.put("/:id/cancel", protect, bookingMutationLimiter, cancelBooking);

// Any authenticated user can delete their own booking
router.delete("/:id", protect, bookingMutationLimiter, deleteBooking);

export default router;
