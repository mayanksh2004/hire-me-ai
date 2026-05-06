import Application from "../models/Application.js";
import Job from "../models/Job.js";

export const applyToJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const existing = await Application.findOne({ user: req.user._id, job: jobId });
    if (existing) return res.status(400).json({ message: "Already applied to this job" });

    const application = await Application.create({
      user: req.user._id,
      job: jobId,
      coverLetter: req.body.coverLetter || "",
      timeline: [{ status: "pending", date: Date.now(), note: "Application submitted" }]
    });

    await application.populate("user", "name email");
    await application.populate("job", "title company");
    res.status(201).json({ message: "Applied successfully", application });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ user: req.user._id }).populate("job", "title company location salary jobType").sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getJobApplications = async (req, res) => {
  try {
    const applications = await Application.find({ job: req.params.jobId }).populate("user", "name email phone location skills bio").sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllApplications = async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id });
    const jobIds = jobs.map(j => j._id);
    const applications = await Application.find({ job: { $in: jobIds } }).populate("user", "name email").populate("job", "title company").sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const application = await Application.findOne({ _id: req.params.id, job: { $in: await Job.find({ postedBy: req.user._id }).select("_id") } });
    if (!application) return res.status(404).json({ message: "Application not found" });

    application.status = status;
    application.notes = note || "";
    application.timeline.push({ status, note: note || `Status changed to ${status}`, date: Date.now() });
    await application.save();
    res.json({ message: "Status updated", application });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};