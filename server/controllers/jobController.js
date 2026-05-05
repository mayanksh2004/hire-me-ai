import Job from "../models/Job.js";
import validateInput from "../utils/validation.js";

export const createJob = async (req, res) => {
  try {
    const { title, company, description, skillsRequired } = req.body;

    const errors = validateInput(req.body, ["title", "company", "description"]);
    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(", ") });
    }

    const job = await Job.create({
      title,
      company,
      description,
      skillsRequired,
      postedBy: req.user._id,
    });

    res.status(201).json({
      message: "Job created successfully",
      job,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET JOBS
export const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find().populate("postedBy", "name email");
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};