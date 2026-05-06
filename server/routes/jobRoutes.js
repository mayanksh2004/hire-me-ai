import express from "express";
import { createJob, getJobs, getJobById, updateJob, deleteJob, getMyJobs } from "../controllers/jobController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();
router.get("/", getJobs);
router.get("/my-jobs", protect, getMyJobs);
router.get("/:id", getJobById);
router.post("/", protect, createJob);
router.put("/:id", protect, updateJob);
router.delete("/:id", protect, deleteJob);

export default router;