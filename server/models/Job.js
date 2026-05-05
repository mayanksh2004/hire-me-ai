import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  company: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  skillsRequired: [
    {
      type: String,
    }
  ],
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }
}, { timestamps: true });

const Job = mongoose.model("Job", jobSchema);

export default Job;