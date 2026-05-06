import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  job: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
  status: { type: String, enum: ["pending", "reviewing", "shortlisted", "rejected", "hired"], default: "pending" },
  coverLetter: { type: String, default: "" },
  resumeUrl: { type: String, default: "" },
  notes: { type: String, default: "" },
  timeline: [{
    status: String,
    date: { type: Date, default: Date.now },
    note: String
  }]
}, { timestamps: true });

export default mongoose.model("Application", applicationSchema);