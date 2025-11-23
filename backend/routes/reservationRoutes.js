import express from "express";
import {
  getAllStalls,
  confirmReservation,
  getUserReservations,
  getAllReservations,
  adminCancelReservation,
  adminRemoveStall,
} from "../controllers/reservationController.js";
import { authenticateToken, verifyRole } from "../middleware/authJwt.js";

const router = express.Router();

// --- Publisher Routes ---
router.get("/stalls", authenticateToken, getAllStalls);
router.post(
  "/reserve",
  authenticateToken,
  verifyRole("publisher"),
  confirmReservation
);
router.get("/user/:email", authenticateToken, getUserReservations);

// --- Admin Routes ---
router.get(
  "/admin/all",
  authenticateToken,
  verifyRole("organizer"),
  getAllReservations
);

router.delete(
  "/admin/cancel/:reservationId",
  authenticateToken,
  verifyRole("organizer"),
  adminCancelReservation
);


router.delete(
  "/admin/unreserve/:stallId",
  authenticateToken,
  verifyRole("organizer"),
  adminRemoveStall 
);

export default router;