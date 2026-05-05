import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
  },
  status: {
    type: String,
    default: "applied",
  }
}, { timestamps: true });

const Application = mongoose.model("Application", applicationSchema);

export default Application;