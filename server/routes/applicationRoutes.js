import express from "express";
import { applyToJob, getAllApplications } from "../controllers/applicationController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:id", protect, applyToJob);
router.get("/all", protect, getAllApplications);

export default router;