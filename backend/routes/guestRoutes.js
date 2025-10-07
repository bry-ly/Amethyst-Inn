import express from "express";
import {
  createGuestProfile,
  getMyGuestProfile,
  getAllGuests,
  updateGuestProfile,
    getMyBookings,
    cancelBooking,
} from "../controllers/guestController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Guest: manage own profile
router.post("/", protect, authorizeRoles("guest"), createGuestProfile);
router.get("/me", protect, authorizeRoles("guest"), getMyGuestProfile);
router.put("/me", protect, authorizeRoles("guest"), updateGuestProfile);
router.get("/me/bookings", protect, authorizeRoles("guest"), getMyBookings);
router.put("/me/bookings/:id/cancel", protect, authorizeRoles("guest"), cancelBooking);

// Staff/Admin: view all guests
router.get("/", protect, authorizeRoles("staff", "admin"), getAllGuests);

export default router;
