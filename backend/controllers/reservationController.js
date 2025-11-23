import admin from "firebase-admin";
import { generateAndUploadQR } from "../services/qrService.js";
import { sendReservationEmail } from "../services/emailService.js";

/**
 * Get all stalls from Firestore
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
 *  Confirm reservation and update Firestore
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

    // Step 1️: Validate input
    if (!email || !stalls || stalls.length === 0) {
      return res.status(400).json({ message: "Invalid reservation data." });
    }

    //  STEP A — CHECK EXISTING RESERVED STALLS (GLOBAL LIMIT = 3) ⭐
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

    // Step 2️: Check for already reserved stalls
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

    // Step 3️: Mark each stall as reserved
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

    // Step 4️: Generate QR
    const qrUrl = await generateAndUploadQR(reservationId, email, publisherName);

    // Step 5️: Save reservation
    await db.collection("reservations").doc(reservationId.toString()).set({
      reservationId,
      email,
      publisherName,
      stalls,
      qrUrl,
      createdAt: new Date().toISOString(),
    });

    // Step 6️: Send confirmation email (optional)
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

    // Step 7️: Respond
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
 * Get all reservations of a specific user (publisher)
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
 *  Admin: Cancel an entire reservation
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
          reservationId: null, // Clear the reservationId
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
 * Admin: Remove a SINGLE stall from a reservation
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
