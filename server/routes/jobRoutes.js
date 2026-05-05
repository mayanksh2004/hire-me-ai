import express from "express";
import { createJob, getJobs } from "../controllers/jobController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createJob);
router.get("/", getJobs);

export default router;