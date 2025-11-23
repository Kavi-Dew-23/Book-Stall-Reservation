import express from "express";
import { getAllStalls, reserveStalls } from "../controllers/stallController.js";

const router = express.Router();

// GET all stalls
router.get("/", getAllStalls);

// POST reserve stalls
router.post("/reserve", reserveStalls);

export default router;
