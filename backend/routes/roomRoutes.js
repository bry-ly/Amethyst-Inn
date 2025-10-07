import express from "express";
import {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
} from "../controllers/roomController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public
router.get("/", getRooms);
router.get("/:id", getRoomById);

// Admin only
router.post("/", protect, authorizeRoles("admin"), createRoom);
router.put("/:id", protect, authorizeRoles("admin"), updateRoom);
router.delete("/:id", protect, authorizeRoles("admin"), deleteRoom);

export default router;
