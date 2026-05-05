import express from "express";
import { analyzeResume } from "../controllers/aiController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/analyze", protect, analyzeResume);

export default router;