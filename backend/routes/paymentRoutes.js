import express from "express";
import {
  getStripeConfig,
  createPaymentIntent,
  confirmPayment,
  handleStripeWebhook,
  getPaymentByBooking,
  refundPayment,
  getAllPayments
} from "../controllers/paymentController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/config", getStripeConfig);
router.post("/webhook", handleStripeWebhook);

// Protected routes (authenticated users)
router.post("/create-payment-intent", protect, createPaymentIntent);
router.post("/confirm", protect, confirmPayment);
router.get("/booking/:bookingId", protect, getPaymentByBooking);

// Admin routes
router.get("/", protect, authorizeRoles("admin"), getAllPayments);
router.post("/:id/refund", protect, authorizeRoles("admin"), refundPayment);

export default router;
