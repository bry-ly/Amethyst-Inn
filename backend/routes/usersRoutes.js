import express from "express";
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateProfile,
} from "../controllers/userController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { adminMutationLimiter, profileUpdateLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

// Authenticated user profile update
router.put("/me", protect, profileUpdateLimiter, updateProfile);

// Admin only
router.get("/", protect, authorizeRoles("admin"), getUsers);
router.get("/:id", protect, authorizeRoles("admin"), getUserById);
router.put("/:id", protect, authorizeRoles("admin"), adminMutationLimiter, updateUser);
router.delete("/:id", protect, authorizeRoles("admin"), adminMutationLimiter, deleteUser);

export default router;
