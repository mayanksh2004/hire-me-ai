import express from "express";
import { createJob, getJobs } from "../controllers/jobController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createJob);
router.get("/", getJobs);
router.get("/my-jobs", protect, async (req, res) => {
  const Job = (await import("../models/Job.js")).default;
  const jobs = await Job.find({ postedBy: req.user._id }).populate("postedBy", "name email");
  res.json(jobs);
});

export default router;