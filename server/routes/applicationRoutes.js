import express from "express";
import multer from "multer";
import { applyToJob, getMyApplications, getJobApplications, getAllApplications, updateApplicationStatus } from "../controllers/applicationController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage, fileFilter: (req, file, cb) => file.mimetype === "application/pdf" ? cb(null, true) : cb(new Error("Only PDF"), false) });

router.post("/:id", protect, applyToJob);
router.get("/my", protect, getMyApplications);
router.get("/job/:jobId", protect, getJobApplications);
router.get("/all", protect, getAllApplications);
router.put("/:id/status", protect, updateApplicationStatus);

export default router;