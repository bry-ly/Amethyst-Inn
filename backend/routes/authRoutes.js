import express from "express";
import {
  registerUser,
  loginUser,
  getProfile,
  setCookieConsent,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { loginLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

// Public
router.post("/register", registerUser);
router.post("/login", loginLimiter, loginUser);
router.post("/cookie-consent", setCookieConsent);

// Private
router.get("/me", protect, getProfile);

export default router;
