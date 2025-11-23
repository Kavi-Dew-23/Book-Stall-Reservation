// backend/index.js
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";
import dotenv from "dotenv";
import stallRoutes from "./routes/stallRoutes.js";
import publisherRoutes from "./routes/publisherRoutes.js";

dotenv.config();
const app = express();

//  Use CORS properly
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", 
      "https://publisher-portal.web.app",
      "https://organizer-portal-bookfair.web.app", "https://book-stall-reservation.web.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

//  Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/stalls", stallRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/publishers", publisherRoutes);

// Add this before the routes
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 5000;

//  Listen on 0.0.0.0 explicitly and add error handling
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT} (host: 0.0.0.0)`);
});

// Handle server errors gracefully
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
  } else {
    console.error('Server failed to start:', err);
  }
  process.exit(1);
});

// Graceful shutdown (optional, but good for Cloud Run)
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});