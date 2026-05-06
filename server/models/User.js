import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["recruiter", "jobseeker"], default: "jobseeker" },
  phone: { type: String, default: "" },
  location: { type: String, default: "" },
  bio: { type: String, default: "" },
  skills: { type: String, default: "" },
  avatar: { type: String, default: "" },
  resume: { type: String, default: "" },
  linkedin: { type: String, default: "" },
  github: { type: String, default: "" },
  website: { type: String, default: "" },
  company: { type: String, default: "" },
  isProfileComplete: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("User", userSchema);