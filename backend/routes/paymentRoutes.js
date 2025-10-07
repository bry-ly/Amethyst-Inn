import express from "express";
import {
  createPayment,
  getPaymentByBooking,
  updateBookingToPaid,
  getPaymentStatus,
} from "../controllers/paymentController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Guest: create payment
router.post("/", protect, authorizeRoles("guest"), createPayment);
router.put("/:id/pay", protect, updateBookingToPaid);
router.get("/:id/status", protect, getPaymentStatus);

// Guest/Staff/Admin: get payment info
router.get(
  "/:bookingId",
  protect,
  authorizeRoles("guest", "staff", "admin"),
  getPaymentByBooking
);

export default router;
