import express from "express";
import multer from "multer";
import { analyzeResume, analyzeResumeFile, doodleChat } from "../controllers/aiController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage, fileFilter: (req, file, cb) => file.mimetype === "application/pdf" ? cb(null, true) : cb(new Error("Only PDF"), false) });

router.post("/analyze", protect, analyzeResume);
router.post("/analyze-file", protect, upload.single("resume"), analyzeResumeFile);
router.post("/doodle", protect, doodleChat);

export default router;