// backend/routes/publisherRoutes.js
import express from "express";
import {
  getPublisherProfile,
  updatePublisherGenres,
} from "../controllers/publisherController.js";
import { authenticateToken } from "../middleware/authJwt.js";

const router = express.Router();

router.get("/:email", authenticateToken, getPublisherProfile);
router.post("/update-genres", authenticateToken, updatePublisherGenres);

export default router;
