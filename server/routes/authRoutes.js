import express from "express";
import { registerUser, loginUser, updateProfile, getUser, getUserById } from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getUser);
router.get("/:id", protect, getUserById);
router.put("/profile", protect, updateProfile);

export default router;