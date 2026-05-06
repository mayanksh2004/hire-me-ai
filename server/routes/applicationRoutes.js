import express from "express";
import { applyToJob, getAllApplications, getMyApplications, updateApplicationStatus } from "../controllers/applicationController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:id", protect, applyToJob);
router.get("/my", protect, getMyApplications);
router.get("/all", protect, getAllApplications);
router.put("/:id/status", protect, updateApplicationStatus);

export default router;