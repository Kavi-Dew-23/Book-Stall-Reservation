// backend/routes/reservationRoutes.js
// import express from "express";
// import {
// 	reserveStalls,
// 	getUserReservations,
// 	adminUsersWithStalls,
// 	getReserverByStall,
// 	getStalls,
// } from "../controllers/reservationController.js";

// const router = express.Router();

// // Public/API
// router.get("/stalls", getStalls); // needed by map to render availability
// router.post("/reserve", reserveStalls); // Reserve stalls (max 3 enforced)
// router.get("/user/:email/reservations", getUserReservations); // View user's reservations

// // Admin
// router.get("/admin/users-with-stalls", adminUsersWithStalls); // list users with their reserved stalls
// router.get("/admin/stall/:id/reserver", getReserverByStall); // get reserver details for a stall


// export default router;

// import express from "express";
// import { confirmReservation } from "../controllers/reservationController.js";
// import { authenticateToken } from "../middleware/authJwt.js";

// const router = express.Router();

// // router.post("/reserve", confirmReservation);
// router.post("/reserve", authenticateToken, confirmReservation);
// export default router;


import express from "express";
import {
  getAllStalls,
  confirmReservation,
  getUserReservations,
  // unreserveStall, // <-- This was the problem, now removed
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

// This route now points to the new, smarter function
router.delete(
  "/admin/unreserve/:stallId",
  authenticateToken,
  verifyRole("organizer"),
  adminRemoveStall // Use new function
);

export default router;


// // comment version #2 - dev_tharindu

// import express from "express";
// import {
//   getAllStalls,
//   confirmReservation,
//   getUserReservations,
//   unreserveStall,
//   // --- NEW ---
//   getAllReservations,
//   adminCancelReservation,
//   // --- END NEW ---
// } from "../controllers/reservationController.js";
// import { authenticateToken, verifyRole } from "../middleware/authJwt.js";

// const router = express.Router();

// // --- Publisher Routes ---
// // Logged-in users can view all stall statuses
// router.get("/stalls", authenticateToken, getAllStalls);

// // Logged-in publishers can reserve
// router.post("/reserve", authenticateToken, verifyRole("publisher"), confirmReservation);

// // A single user can get their own reservations
// router.get("/user/:email", authenticateToken, getUserReservations);

// // --- Admin Routes ---
// // Admin can get a list of ALL reservations
// router.get(
//   "/admin/all",
//   authenticateToken,
//   verifyRole("organizer"),
//   getAllReservations
// );

// // Admin can unreserve a stall (make it available)
// router.put(
//   "/admin/unreserve/:stallId",
//   authenticateToken,
//   verifyRole("organizer"),
//   unreserveStall
// );

// // Admin can cancel a full reservation (deletes reservation, unreserves stalls)
// router.delete(
//   "/admin/cancel/:reservationId",
//   authenticateToken,
//   verifyRole("organizer"),
//   adminCancelReservation
// );

// export default router;


//------------------------------------------------------------------------------------------------------------------------------------------

// // comment the last version - dev_tharindu

// import express from "express";
// import {
//   getAllStalls,
//   confirmReservation,
//   getUserReservations,
//   unreserveStall,
// } from "../controllers/reservationController.js";
// import { authenticateToken } from "../middleware/authJwt.js";

// const router = express.Router();

// // ✅ Logged-in users can view stalls
// router.get("/stalls", authenticateToken, getAllStalls);

// // ✅ Logged-in publishers can reserve
// router.post("/reserve", authenticateToken, confirmReservation);

// // ✅ User’s reservations
// router.get("/user/:email", authenticateToken, getUserReservations);

// // ✅ Admin can unreserve manually
// router.delete("/admin/unreserve/:stallId", authenticateToken, unreserveStall);

// export default router;
