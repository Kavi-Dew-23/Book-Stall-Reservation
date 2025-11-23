// backend/controllers/publisherController.js
import admin from "firebase-admin";

/**
 * ✅ Get publisher profile (with genres)
 */
export const getPublisherProfile = async (req, res) => {
  try {
    const { email } = req.params;
    const db = admin.firestore();

    const doc = await db.collection("publishers").doc(email).get();

    if (!doc.exists) {
      return res.status(200).json({
        name: "",
        email,
        genres: [],
      });
    }

    res.status(200).json(doc.data());
  } catch (err) {
    console.error("❌ Failed to fetch publisher profile:", err);
    res.status(500).json({
      message: "Error fetching publisher data",
      error: err.message,
    });
  }
};

/**
 * ✅ Create or update publisher genres
 */
export const updatePublisherGenres = async (req, res) => {
  try {
    const { email, name, genres } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Publisher email is required" });
    }

    const db = admin.firestore();

    await db.collection("publishers").doc(email).set(
      {
        name: name || "Unknown Publisher",
        email,
        genres: genres || [],
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    res.status(200).json({
      message: "Publisher genres updated successfully",
      genres,
    });
  } catch (err) {
    console.error("❌ Failed to update genres:", err);
    res.status(500).json({
      message: "Error updating publisher genres",
      error: err.message,
    });
  }
};
