// import admin from "firebase-admin";
// import fs from "fs";

// const serviceAccount = JSON.parse(
//   fs.readFileSync(new URL("./firebase-service-account.json", import.meta.url))
// );

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   storageBucket: "stall_qr",
// });

// const db = admin.firestore();
// const bucket = admin.storage().bucket("stall_qr");

// export { db, bucket };

// import admin from "firebase-admin";
// import fs from "fs";

// const serviceAccount = JSON.parse(
//   fs.readFileSync(new URL("./firebase-service-account.json", import.meta.url))
// );

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   storageBucket: "book-stall-reservation.firebasestorage.app", // ✅ correct bucket name
// });

// const db = admin.firestore();
// const bucket = admin.storage().bucket(); // use default configured bucket

// export { db, bucket };

import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname for ES Modules on Windows
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to local JSON file
const localPath = path.join(__dirname, "firebase-service-account.json");

console.log("Local JSON path:", localPath);
console.log("Local JSON exists?", fs.existsSync(localPath));

let serviceAccount;

// 1️⃣ Local development → JSON file exists
if (fs.existsSync(localPath)) {
  console.log("🔥 Using local firebase-service-account.json");
  serviceAccount = JSON.parse(fs.readFileSync(localPath, "utf8"));
}

// 2️⃣ Production (Railway) → use environment variables
else {
  console.log("🚀 Using Railway environment variables");

  serviceAccount = {
    type: process.env.FB_TYPE,
    project_id: process.env.FB_PROJECT_ID,
    private_key_id: process.env.FB_PRIVATE_KEY_ID,
    private_key: process.env.FB_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    client_email: process.env.FB_CLIENT_EMAIL,
    client_id: process.env.FB_CLIENT_ID,
    auth_uri: process.env.FB_AUTH_URI,
    token_uri: process.env.FB_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FB_AUTH_PROVIDER,
    client_x509_cert_url: process.env.FB_CLIENT_CERT,
    universe_domain: process.env.FB_UNIVERSE_DOMAIN,
  };
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "book-stall-reservation.firebasestorage.app"
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

export { db, bucket };
