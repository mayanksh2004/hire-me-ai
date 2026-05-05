import express from "express";
import { applyToJob } from "../controllers/applicationController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:id", protect, applyToJob);

export default router;