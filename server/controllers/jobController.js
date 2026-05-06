import Job from "../models/Job.js";
import Application from "../models/Application.js";

export const createJob = async (req, res) => {
  try {
    const { title, company, companyLogo, description, requirements, skillsRequired, jobType, location, salary, experience, deadline } = req.body;
    if (!title || !company || !description) return res.status(400).json({ message: "Title, company and description are required" });

    const job = await Job.create({
      title, company, companyLogo, description, requirements, skillsRequired, jobType, location, salary, experience, deadline,
      postedBy: req.user._id
    });
    res.status(201).json({ message: "Job created successfully", job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getJobs = async (req, res) => {
  try {
    const { search, jobType, location, page = 1, limit = 20 } = req.query;
    let query = { isActive: true };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { skillsRequired: { $in: [new RegExp(search, "i")] } }
      ];
    }
    if (jobType) query.jobType = jobType;
    if (location) query.location = { $regex: location, $options: "i" };

    const jobs = await Job.find(query).populate("postedBy", "name company").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    const total = await Job.countDocuments(query);
    res.json({ jobs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getJobById = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true }).populate("postedBy", "name email company");
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateJob = async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, postedBy: req.user._id });
    if (!job) return res.status(404).json({ message: "Job not found or unauthorized" });

    Object.assign(job, req.body);
    await job.save();
    res.json({ message: "Job updated", job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, postedBy: req.user._id });
    if (!job) return res.status(404).json({ message: "Job not found or unauthorized" });
    await Application.deleteMany({ job: req.params.id });
    res.json({ message: "Job deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};