import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  companyLogo: { type: String, default: "" },
  description: { type: String, required: true },
  requirements: [{ type: String }],
  skillsRequired: [{ type: String }],
  jobType: { type: String, enum: ["full-time", "part-time", "internship", "contract"], default: "full-time" },
  location: { type: String, default: "" },
  salary: { type: String, default: "" },
  experience: { type: String, default: "" },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  views: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  deadline: { type: Date }
}, { timestamps: true });

export default mongoose.model("Job", jobSchema);