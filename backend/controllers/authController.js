import admin from "firebase-admin";
// import jwt from "jsonwebtoken";
import { signToken} from "../utils/jwt.js";

export const registerUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      confirmPassword,
      role, // "publisher" or an "organizer"
    } = req.body;

    console.log("📩 Incoming registration:", req.body); // Debug log

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    //Ensure phone number is in correct way
    let formattedPhoneNumber = phoneNumber;
    if(phoneNumber && !phoneNumber.startsWith("+")){
        formattedPhoneNumber = "+94" + phoneNumber.replace(/^0/, "");
    }

    // Create Firebase user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
      phoneNumber: formattedPhoneNumber,
    });

    // save the user in firestore with the role publisher
    const userRole = role || "publisher";

    // Save to Firestore
    await admin.firestore().collection("users").doc(userRecord.uid).set({
      firstName,
      lastName,
      email,
      phoneNumber: formattedPhoneNumber,
      role: userRole,
      createdAt: new Date(),
    });

    console.log("✅ User created:", userRecord.uid);
    res.status(201).json({ message: "User registered successfully"});
  } catch (error) {
    console.error("❌ Registration failed:", error);
    res.status(500).json({ message: error.message });
  }
};  

// ---Login User-----
// ---Login User-----
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and Password are required" });
    }

    // Verify Firebase credentials
    const apiKey = process.env.FIREBASE_API_KEY;
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(400).json({ message: data.error.message });
    }

    // 🔹 Get user's role & name from Firestore
    const userRef = admin.firestore().collection("users").where("email", "==", email).limit(1);
    const snapshot = await userRef.get();

    if (snapshot.empty) {
      return res.status(400).json({ message: "User not found in the database" });
    }

    const doc = snapshot.docs[0];
    const userData = doc.data();
    const role = userData.role || "publisher";
    const uid = doc.id;
    const fullName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim();

    // 🔹 Create JWT token with publisher name
    const token = signToken(
      {
        uid,
        email,
        name: fullName || "Publisher",
        role,
      },
      "4h"
    );

    // ✅ Send full details back to frontend
    res.status(200).json({
      message: "Login Successful",
      token,
      role,
      email,
      name: fullName,
    });

  } catch (error) {
    console.error("❌ Login Failed:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};
