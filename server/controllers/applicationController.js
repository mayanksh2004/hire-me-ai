import Application from "../models/Application.js";

// APPLY TO JOB
export const applyToJob = async (req, res) => {
  try {
    const jobId = req.params.id;

    if (!jobId) {
      return res.status(400).json({ message: "Job ID is required" });
    }

    // check duplicate
    const alreadyApplied = await Application.findOne({
      user: req.user._id,
      job: jobId,
    });

    if (alreadyApplied) {
      return res.status(400).json({ message: "Already applied to this job" });
    }

    const application = await Application.create({
      user: req.user._id,
      job: jobId,
    });

    res.status(201).json({
      message: "Applied successfully",
      application,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL APPLICATIONS (for recruiters)
export const getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("user", "name email")
      .populate("job", "title company");
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};