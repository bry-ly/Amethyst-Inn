import express from "express";
import {
  createReservation,
  getReservations,
  getReservationById,
  confirmReservation,
  cancelReservation,
  convertToBooking,
  deleteReservation,
} from "../controllers/reservationController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { uploadIdentification, handleUploadError, saveUploadedFiles } from "../middleware/uploadMiddleware.js";
import {
  reservationCreationLimiter,
  reservationMutationLimiter,
} from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

// Any authenticated user can create reservations (with file upload)
router.post(
  "/",
  protect,
  reservationCreationLimiter,
  uploadIdentification,
  handleUploadError,
  saveUploadedFiles,
  createReservation
);

// Any authenticated user can see their own reservations, staff/admin see all
router.get("/", protect, getReservations);

// Get single reservation
router.get("/:id", protect, getReservationById);

// Confirm reservation (pay deposit)
router.put("/:id/confirm", protect, reservationMutationLimiter, confirmReservation);

// Cancel reservation
router.put("/:id/cancel", protect, reservationMutationLimiter, cancelReservation);

// Convert reservation to booking (staff/admin only)
router.post(
  "/:id/convert",
  protect,
  authorizeRoles("staff", "admin"),
  reservationMutationLimiter,
  convertToBooking
);

// Delete reservation
router.delete("/:id", protect, reservationMutationLimiter, deleteReservation);

export default router;
