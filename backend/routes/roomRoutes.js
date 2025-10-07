import express from "express";
import {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
} from "../controllers/roomController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { adminMutationLimiter } from "../middleware/rateLimitMiddleware.js";

const router = express.Router();

// Public
router.get("/", getRooms);
router.get("/:id", getRoomById);

// Admin only
router.post("/", protect, authorizeRoles("admin"), adminMutationLimiter, createRoom);
router.put("/:id", protect, authorizeRoles("admin"), adminMutationLimiter, updateRoom);
router.delete("/:id", protect, authorizeRoles("admin"), adminMutationLimiter, deleteRoom);

export default router;
