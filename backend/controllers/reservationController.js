// import { generateAndUploadQR } from "../services/qrService.js";
// import { sendReservationEmail } from "../services/emailService.js";
// import { reserveStalls } from "./stallController.js"; // reuse it

// export const confirmReservation = async (req, res) => {
//   try {
//     const { reservationId, email, stalls, publisherName } = req.body;
//     console.log("Received reservation:", { reservationId, email, stalls, publisherName });

//     // ✅ Mark stalls as reserved
//     reserveStalls({ body: { stalls, email, publisherName } }, { 
//       status: () => ({ json: () => {} }) // fake response for reuse
//     });

//     // ✅ Generate QR and upload to Firebase
//     const qrUrl = await generateAndUploadQR(reservationId, email, publisherName);

//     // ✅ Send email with QR code
//     await sendReservationEmail(email, { id: reservationId, stalls, publisherName }, qrUrl);

//     res.status(200).json({
//       message: "Reservation confirmed, QR uploaded & email sent!",
//       qrUrl,
//     });
//   } catch (err) {
//     console.error("❌ Reservation failed:", err);
//     res.status(500).json({ message: "Failed to process reservation", error: err.message });
//   }
// };

// import admin from "firebase-admin";
// import { generateAndUploadQR } from "../services/qrService.js";
// import { sendReservationEmail } from "../services/emailService.js";

// // ✅ Confirm reservation and update Firestore
// export const confirmReservation = async (req, res) => {
//   try {
//     const { reservationId, email, stalls, publisherName } = req.body;

//     console.log("🟢 Received reservation:", {
//       reservationId,
//       email,
//       stalls,
//       publisherName,
//     });

//     const db = admin.firestore();

//     // Step 1️⃣: Validate input
//     if (!email || !stalls || stalls.length === 0) {
//       return res.status(400).json({ message: "Invalid reservation data." });
//     }

//     // Step 2️⃣: Check for already reserved stalls
//     const alreadyReserved = [];
//     for (const stallId of stalls) {
//       const stallDoc = await db.collection("stalls").doc(stallId).get();
//       if (stallDoc.exists && stallDoc.data().isReserved) {
//         alreadyReserved.push(stallId);
//       }
//     }

//     if (alreadyReserved.length > 0) {
//       return res.status(400).json({
//         message: `The following stalls are already reserved: ${alreadyReserved.join(", ")}`,
//       });
//     }

//     // Step 3️⃣: Mark each stall as reserved
//     await Promise.all(
//       stalls.map(async (stallId) => {
//         await db.collection("stalls").doc(stallId).set(
//           {
//             isReserved: true,
//             reservedBy: email,
//             publisherName,
//             reservedAt: new Date().toISOString(),
//           },
//           { merge: true }
//         );
//       })
//     );

//     // Step 4️⃣: Generate QR Code and upload to Firebase
//     const qrUrl = await generateAndUploadQR(reservationId, email, publisherName);

//     // Step 5️⃣: Save reservation in Firestore
//     await db.collection("reservations").doc(reservationId.toString()).set({
//       reservationId,
//       email,
//       publisherName,
//       stalls,
//       qrUrl,
//       createdAt: new Date().toISOString(),
//     });

//     // Step 6️⃣: Send confirmation email with QR code
//     await sendReservationEmail(email, { id: reservationId, stalls, publisherName }, qrUrl);

//     console.log("✅ Reservation successful for:", email);

//     // Step 7️⃣: Return success response
//     res.status(200).json({
//       message: "Reservation confirmed, QR uploaded & email sent!",
//       qrUrl,
//     });
//   } catch (err) {
//     console.error("❌ Reservation failed:", err);
//     res.status(500).json({
//       message: "Failed to process reservation",
//       error: err.message,
//     });
//   }
// };

// import admin from "firebase-admin";
// import { generateAndUploadQR } from "../services/qrService.js";
// import { sendReservationEmail } from "../services/emailService.js";

// /**
//  * ✅ Get all stalls from Firestore
//  * Returns a list of all stalls (reserved or not)
//  */
// export const getAllStalls = async (req, res) => {
//   try {
//     const db = admin.firestore();
//     const snapshot = await db.collection("stalls").get();

//     if (snapshot.empty) {
//       return res.status(200).json([]);
//     }

//     const stalls = snapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(),
//     }));

//     res.status(200).json(stalls);
//   } catch (err) {
//     console.error("❌ Failed to fetch stalls:", err);
//     res.status(500).json({
//       message: "Error fetching stalls",
//       error: err.message,
//     });
//   }
// };

// /**
//  * ✅ Confirm reservation and update Firestore
//  * Creates a reservation record, updates stall status, generates QR,
//  * uploads it to Firebase Storage, and sends confirmation email.
//  */
// export const confirmReservation = async (req, res) => {
//   try {
//     const { reservationId, email, stalls, publisherName } = req.body;

//     console.log("🟢 Received reservation:", {
//       reservationId,
//       email,
//       stalls,
//       publisherName,
//     });

//     const db = admin.firestore();

//     // Step 1️⃣: Validate input
//     if (!email || !stalls || stalls.length === 0) {
//       return res.status(400).json({ message: "Invalid reservation data." });
//     }

//     // Step 2️⃣: Check for already reserved stalls
//     const alreadyReserved = [];
//     for (const stallId of stalls) {
//       const stallDoc = await db.collection("stalls").doc(stallId).get();
//       if (stallDoc.exists && stallDoc.data().isReserved) {
//         alreadyReserved.push(stallId);
//       }
//     }

//     if (alreadyReserved.length > 0) {
//       return res.status(400).json({
//         message: `The following stalls are already reserved: ${alreadyReserved.join(", ")}`,
//       });
//     }

//     // Step 3️⃣: Mark each stall as reserved
//     await Promise.all(
//       stalls.map(async (stallId) => {
//         await db.collection("stalls").doc(stallId).set(
//           {
//             isReserved: true,
//             reservedBy: email,
//             publisherName,
//             reservedAt: new Date().toISOString(),
//           },
//           { merge: true }
//         );
//       })
//     );

//     // Step 4️⃣: Generate QR Code and upload to Firebase
//     const qrUrl = await generateAndUploadQR(reservationId, email, publisherName);

//     // Step 5️⃣: Save reservation in Firestore
//     await db.collection("reservations").doc(reservationId.toString()).set({
//       reservationId,
//       email,
//       publisherName,
//       stalls,
//       qrUrl,
//       createdAt: new Date().toISOString(),
//     });

//     // Step 6️⃣: Send confirmation email with QR code
//     await sendReservationEmail(email, { id: reservationId, stalls, publisherName }, qrUrl);

//     console.log("✅ Reservation successful for:", email);

//     // Step 7️⃣: Return success response
//     res.status(200).json({
//       message: "Reservation confirmed, QR uploaded & email sent!",
//       qrUrl,
//     });
//   } catch (err) {
//     console.error("❌ Reservation failed:", err);
//     res.status(500).json({
//       message: "Failed to process reservation",
//       error: err.message,
//     });
//   }
// };

// /**
//  * ✅ Get all reservations of a specific user
//  */
// export const getUserReservations = async (req, res) => {
//   try {
//     const { email } = req.params;
//     const db = admin.firestore();

//     const snapshot = await db
//       .collection("reservations")
//       .where("email", "==", email)
//       .orderBy("createdAt", "desc")
//       .get();

//     if (snapshot.empty) {
//       return res.status(200).json([]);
//     }

//     const reservations = snapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(),
//     }));

//     res.status(200).json(reservations);
//   } catch (err) {
//     console.error("❌ Failed to fetch user reservations:", err);
//     res.status(500).json({
//       message: "Failed to fetch user reservations",
//       error: err.message,
//     });
//   }
// };

// /**
//  * ✅ (Optional) Admin: Unreserve a stall manually
//  */
// export const unreserveStall = async (req, res) => {
//   try {
//     const { stallId } = req.params;
//     const db = admin.firestore();

//     await db.collection("stalls").doc(stallId).update({
//       isReserved: false,
//       reservedBy: null,
//       publisherName: null,
//       reservedAt: null,
//     });

//     res.status(200).json({ message: `Stall ${stallId} unreserved successfully` });
//   } catch (err) {
//     console.error("❌ Failed to unreserve stall:", err);
//     res.status(500).json({
//       message: "Failed to unreserve stall",
//       error: err.message,
//     });
//   }
// };

// export default {
//   getAllStalls,
//   confirmReservation,
//   getUserReservations,
//   unreserveStall,
// };

//------------------------------------------------------------------------------------------------------------------------------------------------


//------------------------------------------------------------------------------------------------------------------------------------------------
// //comment the version #2 - dev_tharindu 


// import admin from "firebase-admin";
// import { generateAndUploadQR } from "../services/qrService.js";
// import { sendReservationEmail } from "../services/emailService.js";
// import { db } from "../config/firebase.js"; // Import db

// /**
//  * ✅ Get all stalls from Firestore
//  * Returns a list of all stalls (reserved or not)
//  */
// export const getAllStalls = async (req, res) => {
//   try {
//     const snapshot = await db.collection("stalls").get();

//     if (snapshot.empty) {
//       return res.status(200).json([]);
//     }

//     const stalls = snapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(),
//     }));

//     res.status(200).json(stalls);
//   } catch (err) {
//     console.error("❌ Failed to fetch stalls:", err);
//     res.status(500).json({
//       message: "Error fetching stalls",
//       error: err.message,
//     });
//   }
// };

// /**
//  * ✅ Confirm reservation and update Firestore
//  * (Publisher-only action)
//  */
// export const confirmReservation = async (req, res) => {
//   try {
//     const { reservationId, email, stalls, publisherName } = req.body;

//     console.log("🟢 Received reservation:", {
//       reservationId,
//       email,
//       stalls,
//       publisherName,
//     });

//     // Step 1️⃣: Validate input
//     if (!email || !stalls || stalls.length === 0) {
//       return res.status(400).json({ message: "Invalid reservation data." });
//     }

//     // Step 2️⃣: Check for already reserved stalls
//     const alreadyReserved = [];
//     for (const stallId of stalls) {
//       const stallDoc = await db.collection("stalls").doc(stallId).get();
//       if (stallDoc.exists && stallDoc.data().isReserved) {
//         alreadyReserved.push(stallId);
//       }
//     }

//     if (alreadyReserved.length > 0) {
//       return res.status(400).json({
//         message: `The following stalls are already reserved: ${alreadyReserved.join(
//           ", "
//         )}`,
//       });
//     }

//     // Step 3️⃣: Mark each stall as reserved
//     // Use a BATCH write for atomicity
//     const batch = db.batch();
//     stalls.forEach((stallId) => {
//       const stallRef = db.collection("stalls").doc(stallId);
//       batch.set(
//         stallRef,
//         {
//           isReserved: true,
//           reservedBy: email,
//           publisherName,
//           reservedAt: new Date().toISOString(),
//           type: stallId.startsWith("S")
//             ? "small"
//             : stallId.startsWith("M")
//             ? "medium"
//             : "large",
//         },
//         { merge: true }
//       );
//     });

//     // Step 4️⃣: Generate QR Code and upload to Firebase
//     const qrUrl = await generateAndUploadQR(reservationId, email, publisherName);

//     // Step 5️⃣: Save reservation in Firestore
//     const reservationRef = db
//       .collection("reservations")
//       .doc(reservationId.toString());
//     batch.set(reservationRef, {
//       reservationId,
//       email,
//       publisherName,
//       stalls,
//       qrUrl,
//       createdAt: new Date().toISOString(),
//     });

//     // Step 6️⃣: Commit the batch write
//     await batch.commit();

//     // Step 7️⃣: Send confirmation email with QR code (optional)
//     try {
//       await sendReservationEmail(
//         email,
//         { id: reservationId, stalls, publisherName },
//         qrUrl
//       );
//       console.log("📧 Confirmation email sent to:", email);
//     } catch (emailErr) {
//       console.warn("⚠️ Email failed to send:", emailErr.message);
//     }

//     console.log("✅ Reservation successful for:", email);

//     // Step 8️⃣: Return success response
//     res.status(200).json({
//       message: "Reservation confirmed successfully!",
//       qrUrl,
//     });
//   } catch (err) {
//     console.error("❌ Reservation failed:", err);
//     res.status(500).json({
//       message: "Failed to process reservation",
//       error: err.message,
//     });
//   }
// };

// /**
//  * ✅ Get all reservations of a specific user (publisher)
//  */
// export const getUserReservations = async (req, res) => {
//   try {
//     const { email } = req.params;

//     const snapshot = await db
//       .collection("reservations")
//       .where("email", "==", email)
//       .orderBy("createdAt", "desc")
//       .get();

//     if (snapshot.empty) {
//       return res.status(200).json([]);
//     }

//     // Cleanly map all required fields
//     const reservations = snapshot.docs.map((doc) => {
//       const data = doc.data();
//       return {
//         id: doc.id,
//         reservationId: data.reservationId || doc.id,
//         stalls: data.stalls || [],
//         qrUrl: data.qrUrl || null,
//         publisherName: data.publisherName || "Unknown Publisher",
//         email: data.email || email,
//         createdAt: data.createdAt || null,
//       };
//     });

//     res.status(200).json(reservations);
//   } catch (err) {
//     console.error("❌ Failed to fetch user reservations:", err);
//     res.status(500).json({
//       message: "Failed to fetch user reservations",
//       error: err.message,
//     });
//   }
// };

// /**
//  * ✅ Admin: Unreserve a stall manually (change status to 'Available')
//  */
// export const unreserveStall = async (req, res) => {
//   try {
//     const { stallId } = req.params;

//     // Use .set with merge: true to create the doc if it doesn't exist,
//     // or update it if it does.
//     await db.collection("stalls").doc(stallId).set(
//       {
//         isReserved: false,
//         reservedBy: null,
//         publisherName: null,
//         reservedAt: null,
//         // Ensure type is set based on ID
//         type: stallId.startsWith("S")
//           ? "small"
//           : stallId.startsWith("M")
//           ? "medium"
//           : "large",
//       },
//       { merge: true }
//     );

//     res.status(200).json({ message: `Stall ${stallId} set to Available` });
//   } catch (err) {
//     console.error("❌ Failed to unreserve stall:", err);
//     res.status(500).json({
//       message: "Failed to unreserve stall",
//       error: err.message,
//     });
//   }
// };

// // ===================================
// // --- NEW ADMIN FUNCTIONS ---
// // ===================================

// /**
//  * ✅ Admin: Get ALL reservations
//  */
// export const getAllReservations = async (req, res) => {
//   try {
//     const snapshot = await db
//       .collection("reservations")
//       .orderBy("createdAt", "desc")
//       .get();

//     if (snapshot.empty) {
//       return res.status(200).json([]);
//     }

//     const reservations = snapshot.docs.map((doc) => {
//       const data = doc.data();
//       return {
//         id: doc.id,
//         reservationId: data.reservationId || doc.id,
//         stalls: data.stalls || [],
//         qrUrl: data.qrUrl || null,
//         publisherName: data.publisherName || "Unknown Publisher",
//         email: data.email || "Unknown Email",
//         createdAt: data.createdAt || null,
//       };
//     });

//     res.status(200).json(reservations);
//   } catch (err) {
//     console.error("❌ Failed to fetch all reservations:", err);
//     res.status(500).json({
//       message: "Failed to fetch all reservations",
//       error: err.message,
//     });
//   }
// };

// /**
//  * ✅ Admin: Cancel a reservation (deletes record, unreserves stalls)
//  */
// export const adminCancelReservation = async (req, res) => {
//   try {
//     const { reservationId } = req.params;
//     console.log(`Attempting to cancel reservation: ${reservationId}`);

//     const reservationRef = db.collection("reservations").doc(reservationId);
//     const reservationDoc = await reservationRef.get();

//     if (!reservationDoc.exists) {
//       return res.status(404).json({ message: "Reservation not found" });
//     }

//     const reservationData = reservationDoc.data();
//     const stallsToClear = reservationData.stalls || [];

//     // Start a batch write
//     const batch = db.batch();

//     // 1. Un-reserve all stalls associated with this reservation
//     for (const stallId of stallsToClear) {
//       const stallRef = db.collection("stalls").doc(stallId);
//       // We set merge:true just in case a stall doc was never created
//       batch.set(
//         stallRef,
//         {
//           isReserved: false,
//           reservedBy: null,
//           publisherName: null,
//           reservedAt: null,
//           type: stallId.startsWith("S")
//             ? "small"
//             : stallId.startsWith("M")
//             ? "medium"
//             : "large",
//         },
//         { merge: true }
//       );
//     }

//     // 2. Delete the reservation document itself
//     batch.delete(reservationRef);

//     // 3. Commit the batch
//     await batch.commit();

//     // TODO: Optionally delete the QR code from storage
//     // (Skipped for now to avoid complexity)

//     console.log(`✅ Cancelled reservation ${reservationId}`);
//     res
//       .status(200)
//       .json({ message: `Reservation ${reservationId} cancelled successfully` });
//   } catch (err) {
//     console.error("❌ Failed to cancel reservation:", err);
//     res.status(500).json({
//       message: "Failed to cancel reservation",
//       error: err.message,
//     });
//   }
// };

// // --- DEFAULT EXPORT ---
// // Make sure all functions are included
// export default {
//   getAllStalls,
//   confirmReservation,
//   getUserReservations,
//   unreserveStall,
//   getAllReservations, // <-- NEW
//   adminCancelReservation, // <-- NEW
// };


//------------------------------------------------------------------------------------------------------------------------------------------------

// //comment the version #1 - dev_tharindu 


// import admin from "firebase-admin";
// import { generateAndUploadQR } from "../services/qrService.js";
// import { sendReservationEmail } from "../services/emailService.js";

// /**
//  * ✅ Get all stalls from Firestore
//  * Returns a list of all stalls (reserved or not)
//  */
// export const getAllStalls = async (req, res) => {
//   try {
//     const db = admin.firestore();
//     const snapshot = await db.collection("stalls").get();

//     if (snapshot.empty) {
//       return res.status(200).json([]);
//     }

//     const stalls = snapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(),
//     }));

//     res.status(200).json(stalls);
//   } catch (err) {
//     console.error("❌ Failed to fetch stalls:", err);
//     res.status(500).json({
//       message: "Error fetching stalls",
//       error: err.message,
//     });
//   }
// };

// /**
//  * ✅ Confirm reservation and update Firestore
//  * Creates a reservation record, updates stall status, generates QR,
//  * uploads it to Firebase Storage, and sends confirmation email.
//  */
// export const confirmReservation = async (req, res) => {
//   try {
//     const { reservationId, email, stalls, publisherName } = req.body;

//     console.log("🟢 Received reservation:", {
//       reservationId,
//       email,
//       stalls,
//       publisherName,
//     });

//     const db = admin.firestore();

//     // Step 1️⃣: Validate input
//     if (!email || !stalls || stalls.length === 0) {
//       return res.status(400).json({ message: "Invalid reservation data." });
//     }

//     // Step 2️⃣: Check for already reserved stalls
//     const alreadyReserved = [];
//     for (const stallId of stalls) {
//       const stallDoc = await db.collection("stalls").doc(stallId).get();
//       if (stallDoc.exists && stallDoc.data().isReserved) {
//         alreadyReserved.push(stallId);
//       }
//     }

//     if (alreadyReserved.length > 0) {
//       return res.status(400).json({
//         message: `The following stalls are already reserved: ${alreadyReserved.join(", ")}`,
//       });
//     }

//     // Step 3️⃣: Mark each stall as reserved
//     await Promise.all(
//       stalls.map(async (stallId) => {
//         await db.collection("stalls").doc(stallId).set(
//           {
//             isReserved: true,
//             reservedBy: email,
//             publisherName,
//             reservedAt: new Date().toISOString(),
//           },
//           { merge: true }
//         );
//       })
//     );

//     // Step 4️⃣: Generate QR Code and upload to Firebase
//     const qrUrl = await generateAndUploadQR(reservationId, email, publisherName);

//     // Step 5️⃣: Save reservation in Firestore
//     await db.collection("reservations").doc(reservationId.toString()).set({
//       reservationId,
//       email,
//       publisherName,
//       stalls,
//       qrUrl,
//       createdAt: new Date().toISOString(),
//     });

//     // Step 6️⃣: Send confirmation email with QR code (optional)
//     try {
//       await sendReservationEmail(email, { id: reservationId, stalls, publisherName }, qrUrl);
//       console.log("📧 Confirmation email sent to:", email);
//     } catch (emailErr) {
//       console.warn("⚠️ Email failed to send:", emailErr.message);
//     }

//     console.log("✅ Reservation successful for:", email);

//     // Step 7️⃣: Return success response
//     res.status(200).json({
//       message: "Reservation confirmed successfully!",
//       qrUrl,
//     });
//   } catch (err) {
//     console.error("❌ Reservation failed:", err);
//     res.status(500).json({
//       message: "Failed to process reservation",
//       error: err.message,
//     });
//   }
// };

// /**
//  * ✅ Get all reservations of a specific user (publisher)
//  */
// export const getUserReservations = async (req, res) => {
//   try {
//     const { email } = req.params;
//     const db = admin.firestore();

//     const snapshot = await db
//       .collection("reservations")
//       .where("email", "==", email)
//       .orderBy("createdAt", "desc")
//       .get();

//     if (snapshot.empty) {
//       return res.status(200).json([]);
//     }

//     // Cleanly map all required fields
//     const reservations = snapshot.docs.map((doc) => {
//       const data = doc.data();
//       return {
//         id: doc.id,
//         reservationId: data.reservationId || doc.id,
//         stalls: data.stalls || [],
//         qrUrl: data.qrUrl || null,
//         publisherName: data.publisherName || "Unknown Publisher",
//         email: data.email || email,
//         createdAt: data.createdAt || null,
//       };
//     });

//     res.status(200).json(reservations);
//   } catch (err) {
//     console.error("❌ Failed to fetch user reservations:", err);
//     res.status(500).json({
//       message: "Failed to fetch user reservations",
//       error: err.message,
//     });
//   }
// };

// /**
//  * ✅ Admin: Unreserve a stall manually
//  */
// export const unreserveStall = async (req, res) => {
//   try {
//     const { stallId } = req.params;
//     const db = admin.firestore();

//     await db.collection("stalls").doc(stallId).update({
//       isReserved: false,
//       reservedBy: null,
//       publisherName: null,
//       reservedAt: null,
//     });

//     res.status(200).json({ message: `Stall ${stallId} unreserved successfully` });
//   } catch (err) {
//     console.error("❌ Failed to unreserve stall:", err);
//     res.status(500).json({
//       message: "Failed to unreserve stall",
//       error: err.message,
//     });
//   }
// };

// export default {
//   getAllStalls,
//   confirmReservation,
//   getUserReservations,
//   unreserveStall,
// };

// import admin from "firebase-admin";
// import { generateAndUploadQR } from "../services/qrService.js";
// import { sendReservationEmail } from "../services/emailService.js";

// /**
//  * ✅ Get all stalls from Firestore
//  * Returns a list of all stalls (reserved or not)
//  */
// export const getAllStalls = async (req, res) => {
//   try {
//     const db = admin.firestore();
//     const snapshot = await db.collection("stalls").get();

//     if (snapshot.empty) {
//       return res.status(200).json([]);
//     }

//     const stalls = snapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(),
//     }));

//     res.status(200).json(stalls);
//   } catch (err) {
//     console.error("❌ Failed to fetch stalls:", err);
//     res.status(500).json({
//       message: "Error fetching stalls",
//       error: err.message,
//     });
//   }
// };

// /**
//  * ✅ Confirm reservation and update Firestore
//  * Creates a reservation record, updates stall status, generates QR,
//  * uploads it to Firebase Storage, and sends confirmation email.
//  */
// export const confirmReservation = async (req, res) => {
//   try {
//     const { reservationId, email, stalls, publisherName } = req.body;

//     console.log("🟢 Received reservation:", {
//       reservationId,
//       email,
//       stalls,
//       publisherName,
//     });

//     const db = admin.firestore();

//     // Step 1️⃣: Validate input
//     if (!email || !stalls || stalls.length === 0) {
//       return res.status(400).json({ message: "Invalid reservation data." });
//     }

//     // Step 2️⃣: Check for already reserved stalls
//     const alreadyReserved = [];
//     for (const stallId of stalls) {
//       const stallDoc = await db.collection("stalls").doc(stallId).get();
//       if (stallDoc.exists && stallDoc.data().isReserved) {
//         alreadyReserved.push(stallId);
//       }
//     }

//     if (alreadyReserved.length > 0) {
//       return res.status(400).json({
//         message: `The following stalls are already reserved: ${alreadyReserved.join(
//           ", "
//         )}`,
//       });
//     }

//     // Step 3️⃣: Mark each stall as reserved
//     await Promise.all(
//       stalls.map(async (stallId) => {
//         await db
//           .collection("stalls")
//           .doc(stallId)
//           .set(
//             {
//               isReserved: true,
//               reservedBy: email,
//               publisherName,
//               reservedAt: new Date().toISOString(),
//               // --- ✅ NEW ---
//               // Add the reservationId to the stall for tracking
//               reservationId: reservationId,
//               // --- END NEW ---
//             },
//             { merge: true }
//           );
//       })
//     );

//     // Step 4️⃣: Generate QR Code and upload to Firebase
//     const qrUrl = await generateAndUploadQR(reservationId, email, publisherName);

//     // Step 5️⃣: Save reservation in Firestore
//     await db.collection("reservations").doc(reservationId.toString()).set({
//       reservationId,
//       email,
//       publisherName,
//       stalls,
//       qrUrl,
//       createdAt: new Date().toISOString(),
//     });

//     // Step 6️⃣: Send confirmation email with QR code (optional)
//     try {
//       await sendReservationEmail(
//         email,
//         { id: reservationId, stalls, publisherName },
//         qrUrl
//       );
//       console.log("📧 Confirmation email sent to:", email);
//     } catch (emailErr) {
//       console.warn("⚠️ Email failed to send:", emailErr.message);
//     }

//     console.log("✅ Reservation successful for:", email);

//     // Step 7️⃣: Return success response
//     res.status(200).json({
//       message: "Reservation confirmed successfully!",
//       qrUrl,
//     });
//   } catch (err) {
//     console.error("❌ Reservation failed:", err);
//     res.status(500).json({
//       message: "Failed to process reservation",
//       error: err.message,
//     });
//   }
// };

// /**
//  * ✅ Get all reservations of a specific user (publisher)
//  */
// export const getUserReservations = async (req, res) => {
//   try {
//     const { email } = req.params;
//     const db = admin.firestore();

//     const snapshot = await db
//       .collection("reservations")
//       .where("email", "==", email)
//       .orderBy("createdAt", "desc")
//       .get();

//     if (snapshot.empty) {
//       return res.status(200).json([]);
//     }

//     // Cleanly map all required fields
//     const reservations = snapshot.docs.map((doc) => {
//       const data = doc.data();
//       return {
//         id: doc.id,
//         reservationId: data.reservationId || doc.id,
//         stalls: data.stalls || [],
//         qrUrl: data.qrUrl || null,
//         publisherName: data.publisherName || "Unknown Publisher",
//         email: data.email || email,
//         createdAt: data.createdAt || null,
//       };
//     });

//     res.status(200).json(reservations);
//   } catch (err) {
//     console.error("❌ Failed to fetch user reservations:", err);
//     res.status(500).json({
//       message: "Failed to fetch user reservations",
//       error: err.message,
//     });
//   }
// };

// // --- 🛑 DEPRECATED ---
// // This function is too simple and causes data inconsistency.
// // export const unreserveStall = async (req, res) => { ... };

// // -------------------------------------
// // --- ✅ NEW ADMIN FUNCTIONS ---
// // -------------------------------------

// /**
//  * ✅ Admin: Get ALL reservations
//  */
// export const getAllReservations = async (req, res) => {
//   try {
//     const db = admin.firestore();
//     const snapshot = await db
//       .collection("reservations")
//       .orderBy("createdAt", "desc")
//       .get();

//     if (snapshot.empty) {
//       return res.status(200).json([]);
//     }

//     const reservations = snapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(),
//     }));
//     res.status(200).json(reservations);
//   } catch (err) {
//     console.error("❌ Failed to fetch all reservations:", err);
//     res
//       .status(500)
//       .json({ message: "Error fetching all reservations", error: err.message });
//   }
// };

// /**
//  * ✅ Admin: Cancel an entire reservation
//  * (Used by the Reservations Page)
//  */
// export const adminCancelReservation = async (req, res) => {
//   try {
//     const { reservationId } = req.params;
//     const db = admin.firestore();

//     // 1. Get the reservation
//     const resDocRef = db.collection("reservations").doc(reservationId);
//     const resDoc = await resDocRef.get();
//     if (!resDoc.exists) {
//       return res.status(404).json({ message: "Reservation not found." });
//     }

//     const reservedStalls = resDoc.data().stalls || [];

//     // 2. Delete the reservation
//     await resDocRef.delete();

//     // 3. Un-reserve all associated stalls
//     await Promise.all(
//       reservedStalls.map((stallId) =>
//         db.collection("stalls").doc(stallId).update({
//           isReserved: false,
//           reservedBy: null,
//           publisherName: null,
//           reservedAt: null,
//           reservationId: null, // ✅ Clear the reservationId
//         })
//       )
//     );

//     res.status(200).json({ message: "Reservation cancelled successfully." });
//   } catch (err) {
//     console.error("❌ Failed to cancel reservation:", err);
//     res
//       .status(500)
//       .json({ message: "Failed to cancel reservation", error: err.message });
//   }
// };

// /**
//  * ✅ Admin: Remove a SINGLE stall from a reservation
//  * (Used by the Stalls Page)
//  */
// export const adminRemoveStall = async (req, res) => {
//   try {
//     const { stallId } = req.params;
//     const db = admin.firestore();

//     // 1. Get the stall document
//     const stallDocRef = db.collection("stalls").doc(stallId);
//     const stallDoc = await stallDocRef.get();
//     if (!stallDoc.exists) {
//       return res.status(404).json({ message: "Stall not found." });
//     }

//     const stallData = stallDoc.data();
//     const reservationId = stallData.reservationId;

//     // 2. If it has a reservationId, update the reservation
//     if (reservationId) {
//       const resDocRef = db.collection("reservations").doc(reservationId);
//       const resDoc = await resDocRef.get();

//       if (resDoc.exists) {
//         const reservationStalls = resDoc.data().stalls || [];
//         // Remove the stall from the array
//         const updatedStalls = reservationStalls.filter((s) => s !== stallId);

//         if (updatedStalls.length === 0) {
//           // If this was the last stall, delete the whole reservation
//           await resDocRef.delete();
//         } else {
//           // Otherwise, just update the stalls array
//           await resDocRef.update({ stalls: updatedStalls });
//         }
//       }
//     }

//     // 3. Un-reserve the stall in the 'stalls' collection
//     await stallDocRef.update({
//       isReserved: false,
//       reservedBy: null,
//       publisherName: null,
//       reservedAt: null,
//       reservationId: null,
//     });

//     res
//       .status(200)
//       .json({ message: `Stall ${stallId} was successfully un-reserved.` });
//   } catch (err) {
//     console.error("❌ Failed to remove stall:", err);
//     res
//       .status(500)
//       .json({ message: "Failed to remove stall", error: err.message });
//   }
// };

import admin from "firebase-admin";
import { generateAndUploadQR } from "../services/qrService.js";
import { sendReservationEmail } from "../services/emailService.js";

/**
 * ✅ Get all stalls from Firestore
 * Returns a list of all stalls (reserved or not)
 */
export const getAllStalls = async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection("stalls").get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const stalls = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(stalls);
  } catch (err) {
    console.error("❌ Failed to fetch stalls:", err);
    res.status(500).json({
      message: "Error fetching stalls",
      error: err.message,
    });
  }
};

/**
 * ✅ Confirm reservation and update Firestore
 * Creates a reservation record, updates stall status, generates QR,
 * uploads it to Firebase Storage, and sends confirmation email.
 */
export const confirmReservation = async (req, res) => {
  try {
    const { reservationId, email, stalls, publisherName } = req.body;

    console.log("🟢 Received reservation:", {
      reservationId,
      email,
      stalls,
      publisherName,
    });

    const db = admin.firestore();

    // Step 1️⃣: Validate input
    if (!email || !stalls || stalls.length === 0) {
      return res.status(400).json({ message: "Invalid reservation data." });
    }

    // ⭐ STEP A — CHECK EXISTING RESERVED STALLS (GLOBAL LIMIT = 3) ⭐
    const existingSnapshot = await db
      .collection("stalls")
      .where("reservedBy", "==", email)
      .get();

    const alreadyReservedCount = existingSnapshot.size;
    const newTotal = alreadyReservedCount + stalls.length;

    if (newTotal > 3) {
      return res.status(400).json({
        message: `You can reserve only 3 stalls in total. 
You already reserved ${alreadyReservedCount}, 
you are trying to reserve ${stalls.length}, 
total would be ${newTotal}.`,
      });
    }

    // Step 2️⃣: Check for already reserved stalls
    const alreadyReserved = [];
    for (const stallId of stalls) {
      const stallDoc = await db.collection("stalls").doc(stallId).get();
      if (stallDoc.exists && stallDoc.data().isReserved) {
        alreadyReserved.push(stallId);
      }
    }

    if (alreadyReserved.length > 0) {
      return res.status(400).json({
        message: `The following stalls are already reserved: ${alreadyReserved.join(
          ", "
        )}`,
      });
    }

    // Step 3️⃣: Mark each stall as reserved
    await Promise.all(
      stalls.map(async (stallId) => {
        await db
          .collection("stalls")
          .doc(stallId)
          .set(
            {
              isReserved: true,
              reservedBy: email,
              publisherName,
              reservedAt: new Date().toISOString(),
              reservationId: reservationId,
            },
            { merge: true }
          );
      })
    );

    // Step 4️⃣: Generate QR
    const qrUrl = await generateAndUploadQR(reservationId, email, publisherName);

    // Step 5️⃣: Save reservation
    await db.collection("reservations").doc(reservationId.toString()).set({
      reservationId,
      email,
      publisherName,
      stalls,
      qrUrl,
      createdAt: new Date().toISOString(),
    });

    // Step 6️⃣: Send confirmation email (optional)
    try {
      await sendReservationEmail(
        email,
        { id: reservationId, stalls, publisherName },
        qrUrl
      );
      console.log("📧 Confirmation email sent to:", email);
    } catch (emailErr) {
      console.warn("⚠️ Email failed to send:", emailErr.message);
    }

    console.log("✅ Reservation successful for:", email);

    // Step 7️⃣: Respond
    res.status(200).json({
      message: "Reservation confirmed successfully!",
      qrUrl,
    });
  } catch (err) {
    console.error("❌ Reservation failed:", err);
    res.status(500).json({
      message: "Failed to process reservation",
      error: err.message,
    });
  }
};


/**
 * ✅ Get all reservations of a specific user (publisher)
 */
export const getUserReservations = async (req, res) => {
  try {
    const { email } = req.params;
    const db = admin.firestore();

    const snapshot = await db
      .collection("reservations")
      .where("email", "==", email)
      .orderBy("createdAt", "desc")
      .get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    // Cleanly map all required fields
    const reservations = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        reservationId: data.reservationId || doc.id,
        stalls: data.stalls || [],
        qrUrl: data.qrUrl || null,
        publisherName: data.publisherName || "Unknown Publisher",
        email: data.email || email,
        createdAt: data.createdAt || null,
      };
    });

    res.status(200).json(reservations);
  } catch (err) {
    console.error("❌ Failed to fetch user reservations:", err);
    res.status(500).json({
      message: "Failed to fetch user reservations",
      error: err.message,
    });
  }
};

// --- 🛑 DEPRECATED ---
// This function is too simple and causes data inconsistency.
// export const unreserveStall = async (req, res) => { ... };

// -------------------------------------
// --- ✅ NEW ADMIN FUNCTIONS ---
// -------------------------------------

/**
 * ✅ Admin: Get ALL reservations
 */
export const getAllReservations = async (req, res) => {
  try {
    const db = admin.firestore();
    const snapshot = await db
      .collection("reservations")
      .orderBy("createdAt", "desc")
      .get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const reservations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(reservations);
  } catch (err) {
    console.error("❌ Failed to fetch all reservations:", err);
    res
      .status(500)
      .json({ message: "Error fetching all reservations", error: err.message });
  }
};

/**
 * ✅ Admin: Cancel an entire reservation
 * (Used by the Reservations Page)
 */
export const adminCancelReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const db = admin.firestore();

    // 1. Get the reservation
    const resDocRef = db.collection("reservations").doc(reservationId);
    const resDoc = await resDocRef.get();
    if (!resDoc.exists) {
      return res.status(404).json({ message: "Reservation not found." });
    }

    const reservedStalls = resDoc.data().stalls || [];

    // 2. Delete the reservation
    await resDocRef.delete();

    // 3. Un-reserve all associated stalls
    await Promise.all(
      reservedStalls.map((stallId) =>
        db.collection("stalls").doc(stallId).update({
          isReserved: false,
          reservedBy: null,
          publisherName: null,
          reservedAt: null,
          reservationId: null, // ✅ Clear the reservationId
        })
      )
    );

    res.status(200).json({ message: "Reservation cancelled successfully." });
  } catch (err) {
    console.error("❌ Failed to cancel reservation:", err);
    res
      .status(500)
      .json({ message: "Failed to cancel reservation", error: err.message });
  }
};

/**
 * ✅ Admin: Remove a SINGLE stall from a reservation
 * (Used by the Stalls Page)
 */
export const adminRemoveStall = async (req, res) => {
  try {
    const { stallId } = req.params;
    const db = admin.firestore();

    // 1. Get the stall document
    const stallDocRef = db.collection("stalls").doc(stallId);
    const stallDoc = await stallDocRef.get();
    if (!stallDoc.exists) {
      return res.status(404).json({ message: "Stall not found." });
    }

    const stallData = stallDoc.data();
    const reservationId = stallData.reservationId;

    // 2. If it has a reservationId, update the reservation
    if (reservationId) {
      const resDocRef = db.collection("reservations").doc(reservationId);
      const resDoc = await resDocRef.get();

      if (resDoc.exists) {
        const reservationStalls = resDoc.data().stalls || [];
        // Remove the stall from the array
        const updatedStalls = reservationStalls.filter((s) => s !== stallId);

        if (updatedStalls.length === 0) {
          // If this was the last stall, delete the whole reservation
          await resDocRef.delete();
        } else {
          // Otherwise, just update the stalls array
          await resDocRef.update({ stalls: updatedStalls });
        }
      }
    }

    // 3. Un-reserve the stall in the 'stalls' collection
    await stallDocRef.update({
      isReserved: false,
      reservedBy: null,
      publisherName: null,
      reservedAt: null,
      reservationId: null,
    });

    res
      .status(200)
      .json({ message: `Stall ${stallId} was successfully un-reserved.` });
  } catch (err) {
    console.error("❌ Failed to remove stall:", err);
    res
      .status(500)
      .json({ message: "Failed to remove stall", error: err.message });
  }
};
