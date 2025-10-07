import express from "express";
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin only
router.get("/", protect, authorizeRoles("admin"), getUsers);
router.get("/:id", protect, authorizeRoles("admin"), getUserById);
router.put("/:id", protect, authorizeRoles("admin"), updateUser);
router.delete("/:id", protect, authorizeRoles("admin"), deleteUser);

export default router;
