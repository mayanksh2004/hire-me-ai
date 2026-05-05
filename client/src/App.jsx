import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

function App() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState("jobs");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("jobseeker");

  const [newJob, setNewJob] = useState({ title: "", company: "", description: "", skills: "" });
  const [resumeText, setResumeText] = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (token) {
      fetchUser();
      fetchJobs();
      if (user?.role === "recruiter") {
        fetchApplications();
      }
    }
  }, [token, user?.role]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_URL}/api/protected`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        logout();
      }
    } catch (err) {
      console.error("Failed to fetch user:", err);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/jobs`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setJobs(data);
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await fetch(`${API_URL}/api/applications/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setUser(data.user);
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setUser(data.user);
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
    setEmail("");
    setPassword("");
    setView("jobs");
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const skillsArray = newJob.skills.split(",").map(s => s.trim()).filter(s => s);
      const res = await fetch(`${API_URL}/api/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newJob.title,
          company: newJob.company,
          description: newJob.description,
          skillsRequired: skillsArray,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Job posted successfully!");
        setNewJob({ title: "", company: "", description: "", skills: "" });
        fetchJobs();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to post job");
    }
    setLoading(false);
  };

  const applyJob = async (jobId) => {
    if (!token) {
      setError("Please login to apply");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/applications/${jobId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to apply. Please try again.");
    }
  };

  const handleAnalyzeResume = async () => {
    if (!resumeText.trim()) {
      setError("Please enter your resume text");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resumeText }),
      });
      const data = await res.json();
      if (res.ok) {
        setAiResult(data.result);
      } else {
        setError(data.message || "Failed to analyze resume");
      }
    } catch (err) {
      setError("Failed to analyze resume. Please try again.");
    }
    setLoading(false);
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const myApplications = applications.filter(app => app.user?._id === user?._id);

  return (
    <>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
      <style>{`
        body { background: #f8f9fa; min-height: 100vh; }
        .navbar-brand { font-weight: 700; font-size: 1.5rem; }
        .hero-section { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 60px 0; margin-bottom: 30px; }
        .job-card { transition: transform 0.2s, box-shadow 0.2s; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .job-card:hover { transform: translateY(-4px); box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
        .skill-tag { background: #e9ecef; padding: 4px 10px; border-radius: 20px; font-size: 0.85rem; margin-right: 5px; }
        .auth-card { max-width: 450px; margin: 50px auto; }
        .nav-pills .nav-link.active { background: #667eea; }
        .result-box { background: white; padding: 20px; border-radius: 10px; white-space: pre-wrap; line-height: 1.8; }
      `}</style>
      
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <a className="navbar-brand" href="#">Hire Me AI</a>
          {token && (
            <div className="d-flex align-items-center">
              <span className="text-white me-3">Welcome, {user?.name}</span>
              <span className="badge bg-secondary me-3">{user?.role}</span>
              <button className="btn btn-outline-light btn-sm" onClick={logout}>Logout</button>
            </div>
          )}
        </div>
      </nav>

      {!token ? (
        <div className="container">
          <div className="hero-section text-center rounded">
            <h1 className="display-4 fw-bold">Find Your Dream Job</h1>
            <p className="lead">AI-powered job matching and resume analysis</p>
          </div>

          <div className="card auth-card shadow">
            <div className="card-body p-4">
              <ul className="nav nav-pills mb-3" role="tablist">
                <li className="nav-item">
                  <button className={`nav-link ${!showRegister ? 'active' : ''}`} onClick={() => setShowRegister(false)}>Login</button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link ${showRegister ? 'active' : ''}`} onClick={() => setShowRegister(true)}>Register</button>
                </li>
              </ul>

              {error && <div className="alert alert-danger">{error}</div>}

              <form onSubmit={showRegister ? handleRegister : handleLogin}>
                {showRegister && (
                  <>
                    <div className="mb-3">
                      <label className="form-label">Name</label>
                      <input className="form-control" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Role</label>
                      <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                        <option value="jobseeker">Job Seeker</option>
                        <option value="recruiter">Recruiter</option>
                      </select>
                    </div>
                  </>
                )}
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-control" placeholder="Minimum 6 characters" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? "Please wait..." : showRegister ? "Register" : "Login"}
                </button>
              </form>
            </div>
          </div>

          <div className="row mt-5">
            <div className="col-md-4 text-center">
              <div className="card border-0 bg-transparent">
                <div className="display-5 text-primary mb-3">🔍</div>
                <h5>Search Jobs</h5>
                <p className="text-muted">Browse thousands of job listings</p>
              </div>
            </div>
            <div className="col-md-4 text-center">
              <div className="card border-0 bg-transparent">
                <div className="display-5 text-primary mb-3">🤖</div>
                <h5>AI Analysis</h5>
                <p className="text-muted">Get AI-powered resume feedback</p>
              </div>
            </div>
            <div className="col-md-4 text-center">
              <div className="card border-0 bg-transparent">
                <div className="display-5 text-primary mb-3">📨</div>
                <h5>Easy Apply</h5>
                <p className="text-muted">One-click job applications</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="container mt-4">
          {error && <div className="alert alert-danger alert-dismissible">
            {error} <button className="btn-close" onClick={() => setError("")}></button>
          </div>}

          <ul className="nav nav-pills mb-4">
            <li className="nav-item">
              <button className={`nav-link ${view === 'jobs' ? 'active' : ''}`} onClick={() => setView('jobs')}>Browse Jobs</button>
            </li>
            {user?.role === "recruiter" && (
              <li className="nav-item">
                <button className={`nav-link ${view === 'post' ? 'active' : ''}`} onClick={() => setView('post')}>Post Job</button>
              </li>
            )}
            {user?.role === "recruiter" && (
              <li className="nav-item">
                <button className={`nav-link ${view === 'applications' ? 'active' : ''}`} onClick={() => setView('applications')}>Applications</button>
              </li>
            )}
            {user?.role === "jobseeker" && (
              <li className="nav-item">
                <button className={`nav-link ${view === 'applied' ? 'active' : ''}`} onClick={() => setView('applied')}>My Applications</button>
              </li>
            )}
            {user?.role === "jobseeker" && (
              <li className="nav-item">
                <button className={`nav-link ${view === 'ai' ? 'active' : ''}`} onClick={() => setView('ai')}>AI Resume Analyzer</button>
              </li>
            )}
          </ul>

          {view === 'jobs' && (
            <>
              <div className="mb-4">
                <input type="text" className="form-control" placeholder="Search jobs by title, company, or description..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <div className="row">
                {filteredJobs.length === 0 ? (
                  <div className="col-12 text-center py-5">
                    <h4 className="text-muted">No jobs found</h4>
                  </div>
                ) : (
                  filteredJobs.map(job => (
                    <div className="col-md-6 mb-4" key={job._id}>
                      <div className="card job-card h-100">
                        <div className="card-body">
                          <h5 className="card-title">{job.title}</h5>
                          <h6 className="card-subtitle mb-2 text-muted">{job.company}</h6>
                          <p className="card-text">{job.description.substring(0, 150)}...</p>
                          {job.skillsRequired?.length > 0 && (
                            <div className="mb-3">
                              {job.skillsRequired.map((skill, i) => (
                                <span key={i} className="skill-tag">{skill}</span>
                              ))}
                            </div>
                          )}
                          {user?.role === "jobseeker" && (
                            <button className="btn btn-primary" onClick={() => applyJob(job._id)}>Apply Now</button>
                          )}
                        </div>
                        <div className="card-footer text-muted small">
                          Posted by {job.postedBy?.name}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {view === 'post' && user?.role === "recruiter" && (
            <div className="card shadow">
              <div className="card-header bg-primary text-white">
                <h4 className="mb-0">Post a New Job</h4>
              </div>
              <div className="card-body">
                <form onSubmit={handlePostJob}>
                  <div className="mb-3">
                    <label className="form-label">Job Title</label>
                    <input className="form-control" placeholder="e.g. Software Engineer" value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Company Name</label>
                    <input className="form-control" placeholder="e.g. Google" value={newJob.company} onChange={e => setNewJob({...newJob, company: e.target.value})} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Job Description</label>
                    <textarea className="form-control" rows="4" placeholder="Describe the job role, responsibilities, and requirements..." value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Required Skills (comma separated)</label>
                    <input className="form-control" placeholder="e.g. JavaScript, React, Node.js" value={newJob.skills} onChange={e => setNewJob({...newJob, skills: e.target.value})} />
                  </div>
                  <button type="submit" className="btn btn-success" disabled={loading}>
                    {loading ? "Posting..." : "Post Job"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {view === 'applications' && user?.role === "recruiter" && (
            <div className="card shadow">
              <div className="card-header">
                <h4 className="mb-0">Job Applications</h4>
              </div>
              <div className="card-body">
                {applications.length === 0 ? (
                  <p className="text-muted">No applications yet</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Job Title</th>
                          <th>Applicant</th>
                          <th>Email</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applications.map(app => (
                          <tr key={app._id}>
                            <td>{app.job?.title}</td>
                            <td>{app.user?.name}</td>
                            <td>{app.user?.email}</td>
                            <td><span className="badge bg-primary">{app.status}</span></td>
                            <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'applied' && user?.role === "jobseeker" && (
            <div className="card shadow">
              <div className="card-header">
                <h4 className="mb-0">My Applications</h4>
              </div>
              <div className="card-body">
                {myApplications.length === 0 ? (
                  <p className="text-muted">You haven't applied to any jobs yet</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Job Title</th>
                          <th>Company</th>
                          <th>Status</th>
                          <th>Date Applied</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myApplications.map(app => (
                          <tr key={app._id}>
                            <td>{app.job?.title}</td>
                            <td>{app.job?.company}</td>
                            <td><span className="badge bg-success">{app.status}</span></td>
                            <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'ai' && user?.role === "jobseeker" && (
            <div className="card shadow">
              <div className="card-header bg-gradient text-white" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                <h4 className="mb-0">AI Resume Analyzer</h4>
              </div>
              <div className="card-body">
                <p className="text-muted">Paste your resume text below and get AI-powered feedback on your strengths, gaps, and improvement suggestions.</p>
                <div className="mb-3">
                  <textarea className="form-control" rows="10" placeholder="Paste your resume here..." value={resumeText} onChange={e => setResumeText(e.target.value)} />
                </div>
                <button className="btn btn-primary" onClick={handleAnalyzeResume} disabled={loading}>
                  {loading ? "Analyzing..." : "Analyze Resume"}
                </button>
                {aiResult && (
                  <div className="mt-4 result-box shadow-sm">
                    <h5 className="border-bottom pb-2 mb-3">Analysis Result:</h5>
                    <p>{aiResult}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <footer className="bg-dark text-white text-center py-3 mt-5">
        <p className="mb-0">© 2024 Hire Me AI - Final Year Project</p>
      </footer>
    </>
  );
}

export default App;