import { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

const API_URL = "";

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [view, setView] = useState("home");
  const [darkMode, setDarkMode] = useState(localStorage.getItem("darkMode") === "true");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Auth state
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "", role: "jobseeker" });
  
  // Data state
  const [jobs, setJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [jobApplications, setJobApplications] = useState([]);
  const [search, setSearch] = useState({ keyword: "", jobType: "", location: "" });
  const [selectedJob, setSelectedJob] = useState(null);
  
  // Profile state
  const [profile, setProfile] = useState({ name: "", email: "", phone: "", location: "", bio: "", skills: "", linkedin: "", github: "", website: "", company: "" });
  
  // Resume analyzer
  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [aiResult, setAiResult] = useState("");
  
  // Doodle Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([{ from: "bot", text: "Hi! I'm Doodle, your AI career assistant! 🤖 How can I help you today?" }]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    document.body.className = darkMode ? "dark" : "light";
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (token) fetchUser();
  }, [token]);

  useEffect(() => {
    if (user) {
      fetchJobs();
      if (user.role === "recruiter") {
        fetchMyJobs();
        fetchAllApplications();
      } else {
        fetchMyApplications();
      }
    }
  }, [user]);

  useEffect(() => {
    if (chatOpen && chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatOpen]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setProfile({ name: data.name || "", email: data.email || "", phone: data.phone || "", location: data.location || "", bio: data.bio || "", skills: data.skills || "", linkedin: data.linkedin || "", github: data.github || "", website: data.website || "", company: data.company || "" });
      } else logout();
    } catch (err) { console.error(err); }
  };

  const fetchJobs = async () => {
    try {
      const params = new URLSearchParams();
      if (search.keyword) params.append("search", search.keyword);
      if (search.jobType) params.append("jobType", search.jobType);
      if (search.location) params.append("location", search.location);
      const res = await fetch(`${API_URL}/api/jobs?${params}`);
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err) { console.error(err); }
  };

  const fetchMyJobs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/jobs/my-jobs`, { headers: { Authorization: `Bearer ${token}` } });
      setMyJobs(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchMyApplications = async () => {
    try {
      const res = await fetch(`${API_URL}/api/applications/my`, { headers: { Authorization: `Bearer ${token}` } });
      setApplications(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchAllApplications = async () => {
    try {
      const res = await fetch(`${API_URL}/api/applications/all`, { headers: { Authorization: `Bearer ${token}` } });
      setApplications(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/auth/${isLogin ? "login" : "register"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setUser(data.user);
        setShowAuth(false);
      } else setError(data.message);
    } catch (err) { setError("Network error"); }
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
    setView("home");
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...profile, title: selectedJob?.title, company: selectedJob?.company, description: selectedJob?.description, skillsRequired: selectedJob?.skills?.split(",").map(s => s.trim()) })
      });
      if (res.ok) { alert("Job posted!"); fetchMyJobs(); setView("my-jobs"); }
    } catch (err) { setError("Failed to post job"); }
    setLoading(false);
  };

  const handleApply = async (jobId) => {
    if (!token) return setShowAuth(true);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/applications/${jobId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      alert(data.message);
    } catch (err) { setError("Failed to apply"); }
    setLoading(false);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(profile)
      });
      if (res.ok) { alert("Profile updated!"); fetchUser(); }
    } catch (err) { setError("Failed to update"); }
    setLoading(false);
  };

  const handleAnalyzeResume = async () => {
    if (!resumeText && !resumeFile) return setError("Enter text or upload PDF");
    setLoading(true);
    try {
      if (resumeFile) {
        const formData = new FormData();
        formData.append("resume", resumeFile);
        const res = await fetch(`${API_URL}/api/ai/analyze-file`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
        const data = await res.json();
        setAiResult(data.result);
      } else {
        const res = await fetch(`${API_URL}/api/ai/analyze`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ resumeText }) });
        const data = await res.json();
        setAiResult(data.result);
      }
    } catch (err) { setError("Analysis failed"); }
    setLoading(false);
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { from: "user", text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/doodle`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: chatInput, history: chatMessages })
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { from: "bot", text: data.response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { from: "bot", text: "Oops! Something went wrong. Try again! 😅" }]);
    }
    setLoading(false);
  };

  // STYLES
  const styles = {
    css: `
      :root { --primary: #f97316; --primary-dark: #ea580c; }
      body.light { background: #f8fafc; color: #1e293b; }
      body.dark { background: #0f172a; color: #e2e8f0; }
      body.dark .card { background: #1e293b; border-color: #334155; }
      body.dark .modal-content { background: #1e293b; border-color: #334155; }
      body.dark input, body.dark textarea, body.dark select { background: #334155; border-color: #475569; color: #e2e8f0; }
      .navbar { background: white !important; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
      body.dark .navbar { background: #1e293b !important; border-bottom: 1px solid #334155; }
      .navbar-brand { color: var(--primary) !important; font-weight: 700; font-size: 1.5rem; }
      .hero { background: linear-gradient(135deg, #f97316, #fb923c, #fdba74); padding: 80px 0; color: white; }
      .job-card { transition: all 0.3s; border-radius: 16px; overflow: hidden; }
      .job-card:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(249,115,22,0.2); }
      .skill-tag { background: #fef3c7; color: #b45309; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; }
      body.dark .skill-tag { background: #7c2d12; color: #fed7aa; }
      .btn-primary { background: var(--primary); border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; }
      .btn-primary:hover { background: var(--primary-dark); }
      .sidebar { background: white; border-right: 1px solid #e2e8f0; height: 100vh; position: fixed; width: 260px; padding: 20px; }
      body.dark .sidebar { background: #1e293b; border-color: #334155; }
      .sidebar-item { padding: 12px 16px; border-radius: 10px; cursor: pointer; margin-bottom: 8px; color: #64748b; display: flex; align-items: center; gap: 12px; }
      .sidebar-item:hover, .sidebar-item.active { background: #fff7ed; color: var(--primary); }
      body.dark .sidebar-item:hover, body.dark .sidebar-item.active { background: #7c2d12; color: white; }
      .main-content { margin-left: 260px; padding: 20px; min-height: 100vh; }
      .auth-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
      .auth-box { background: white; border-radius: 20px; padding: 40px; max-width: 420px; width: 90%; }
      body.dark .auth-box { background: #1e293b; }
      .doodle-chat { position: fixed; bottom: 20px; right: 20px; z-index: 999; }
      .doodle-btn { width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #f97316, #ea580c); border: none; color: white; font-size: 1.8rem; cursor: pointer; box-shadow: 0 4px 20px rgba(249,115,22,0.4); }
      .doodle-window { position: absolute; bottom: 80px; right: 0; width: 380px; height: 500px; background: white; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); overflow: hidden; }
      body.dark .doodle-window { background: #1e293b; }
      .doodle-header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 15px 20px; display: flex; align-items: center; gap: 12px; }
      .doodle-messages { height: 380px; overflow-y: auto; padding: 20px; }
      .doodle-msg { margin-bottom: 12px; max-width: 80%; padding: 12px 16px; border-radius: 16px; }
      .doodle-msg.bot { background: #f1f5f9; color: #1e293b; border-bottom-left-radius: 4px; }
      body.dark .doodle-msg.bot { background: #334155; color: #e2e8f0; }
      .doodle-msg.user { background: #f97316; color: white; margin-left: auto; border-bottom-right-radius: 4px; }
      .doodle-input { padding: 15px; border-top: 1px solid #e2e8f0; display: flex; gap: 10px; }
      body.dark .doodle-input { border-color: #334155; }
      .doodle-input input { flex: 1; padding: 12px; border: 1px solid #e2e8f0; border-radius: 10px; }
      .doodle-input button { padding: 12px 20px; background: #f97316; border: none; border-radius: 10px; color: white; }
      .typewriter { display: inline-block; }
      .fade-in { animation: fadeIn 0.3s ease-in; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    `
  };

  return (
    <>
      <style>{styles.css}</style>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* Auth Modal */}
      {showAuth && (
        <div className="auth-modal" onClick={() => setShowAuth(false)}>
          <div className="auth-box" onClick={e => e.stopPropagation()}>
            <h3 className="text-center mb-4">{isLogin ? "Welcome Back" : "Create Account"}</h3>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleAuth}>
              {!isLogin && <input className="form-control mb-3" placeholder="Full Name" value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} required />}
              {!isLogin && <select className="form-select mb-3" value={authForm.role} onChange={e => setAuthForm({...authForm, role: e.target.value})}><option value="jobseeker">Job Seeker</option><option value="recruiter">Recruiter</option></select>}
              <input className="form-control mb-3" type="email" placeholder="Email" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} required />
              <input className="form-control mb-3" type="password" placeholder="Password" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} required />
              <button className="btn btn-primary w-100" disabled={loading}>{loading ? "..." : isLogin ? "Login" : "Register"}</button>
            </form>
            <p className="text-center mt-3">{isLogin ? "Don't have account?" : "Already have account?"} <span style={{color: "#f97316", cursor: "pointer"}} onClick={() => {setIsLogin(!isLogin); setError("");}}>{isLogin ? "Register" : "Login"}</span></p>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="navbar navbar-expand-lg py-3">
        <div className="container">
          <a className="navbar-brand" href="#" onClick={() => setView("home")}>⚡ Hire Me AI</a>
          <div className="d-flex align-items-center gap-3">
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setDarkMode(!darkMode)}>{darkMode ? "☀️" : "🌙"}</button>
            {user ? (
              <>
                <span className="fw-medium">{user.name}</span>
                <button className="btn btn-outline-danger btn-sm" onClick={logout}>Logout</button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={() => setShowAuth(true)}>Get Started</button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {user ? (
        <div className="d-flex">
          {/* Sidebar */}
          <div className="sidebar">
            <div className="text-center mb-4">
              <div style={{width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg, #f97316, #ea580c)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "1.5rem", fontWeight: "bold", margin: "0 auto 10px"}}>{user.name?.charAt(0)}</div>
              <div className="fw-semibold">{user.name}</div>
              <div className="text-muted small text-capitalize">{user.role}</div>
            </div>
            <div className={`sidebar-item ${view === "jobs" ? "active" : ""}`} onClick={() => setView("jobs")}>📋 Browse Jobs</div>
            {user.role === "jobseeker" && <><div className={`sidebar-item ${view === "applied" ? "active" : ""}`} onClick={() => setView("applied")}>📨 My Applications</div><div className={`sidebar-item ${view === "analyzer" ? "active" : ""}`} onClick={() => setView("analyzer")}>🤖 AI Resume Analyzer</div></>}
            {user.role === "recruiter" && <><div className={`sidebar-item ${view === "post" ? "active" : ""}`} onClick={() => setView("post")}>➕ Post a Job</div><div className={`sidebar-item ${view === "my-jobs" ? "active" : ""}`} onClick={() => setView("my-jobs")}>📁 My Posted Jobs</div><div className={`sidebar-item ${view === "applications" ? "active" : ""}`} onClick={() => setView("applications")}>👥 Applicants</div></>}
            <div className={`sidebar-item ${view === "profile" ? "active" : ""}`} onClick={() => setView("profile")}>👤 Edit Profile</div>
            <div className={`sidebar-item ${view === "settings" ? "active" : ""}`} onClick={() => setView("settings")}>⚙️ Settings</div>
          </div>

          {/* Views */}
          <div className="main-content">
            {error && <div className="alert alert-danger">{error} <button className="btn-close" onClick={() => setError("")}></button></div>}
            
            {/* Jobs View */}
            {view === "jobs" && (
              <div className="fade-in">
                <h4 className="mb-4">🔍 Browse Jobs</h4>
                <div className="row mb-4">
                  <div className="col-md-4"><input className="form-control" placeholder="Search jobs..." value={search.keyword} onChange={e => setSearch({...search, keyword: e.target.value})} onKeyDown={e => e.key === "Enter" && fetchJobs()} /></div>
                  <div className="col-md-3"><select className="form-select" value={search.jobType} onChange={e => setSearch({...search, jobType: e.target.value})}><option value="">All Types</option><option value="full-time">Full Time</option><option value="part-time">Part Time</option><option value="internship">Internship</option><option value="contract">Contract</option></select></div>
                  <div className="col-md-3"><input className="form-control" placeholder="Location" value={search.location} onChange={e => setSearch({...search, location: e.target.value})} /></div>
                  <div className="col-md-2"><button className="btn btn-primary w-100" onClick={fetchJobs}>Search</button></div>
                </div>
                <div className="row">
                  {jobs.length === 0 ? <div className="text-center text-muted py-5">No jobs found</div> : jobs.map(job => (
                    <div className="col-md-6 mb-4" key={job._id}>
                      <div className="card job-card h-100">
                        <div className="card-body">
                          <h5 className="card-title">{job.title}</h5>
                          <p className="text-muted mb-2">{job.company} • {job.location}</p>
                          <p className="mb-3" style={{color: "#64748b"}}>{job.description?.substring(0, 120)}...</p>
                          <div className="d-flex flex-wrap gap-2 mb-3">{job.skillsRequired?.slice(0,4).map((s, i) => <span key={i} className="skill-tag">{s}</span>)}</div>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="text-muted small">{job.views} views</span>
                            {user.role === "jobseeker" && <button className="btn btn-primary btn-sm" onClick={() => handleApply(job._id)}>Apply</button>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* My Applications */}
            {view === "applied" && user.role === "jobseeker" && (
              <div className="fade-in">
                <h4 className="mb-4">📨 My Applications</h4>
                {applications.length === 0 ? <div className="text-center text-muted py-5">No applications yet</div> : (
                  <div className="table-responsive">
                    <table className="table">
                      <thead><tr><th>Job</th><th>Company</th><th>Status</th><th>Date</th></tr></thead>
                      <tbody>
                        {applications.map(app => (
                          <tr key={app._id}>
                            <td>{app.job?.title}</td>
                            <td>{app.job?.company}</td>
                            <td><span className={`badge ${app.status === "hired" ? "bg-success" : app.status === "rejected" ? "bg-danger" : "bg-warning"}`}>{app.status}</span></td>
                            <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Post Job */}
            {view === "post" && user.role === "recruiter" && (
              <div className="fade-in">
                <h4 className="mb-4">➕ Post a New Job</h4>
                <div className="card" style={{maxWidth: 600}}>
                  <div className="card-body">
                    <form onSubmit={handlePostJob}>
                      <input className="form-control mb-3" placeholder="Job Title" value={selectedJob?.title || ""} onChange={e => setSelectedJob({...selectedJob, title: e.target.value})} required />
                      <input className="form-control mb-3" placeholder="Company Name" value={selectedJob?.company || ""} onChange={e => setSelectedJob({...selectedJob, company: e.target.value})} required />
                      <textarea className="form-control mb-3" placeholder="Job Description" rows="4" value={selectedJob?.description || ""} onChange={e => setSelectedJob({...selectedJob, description: e.target.value})} required />
                      <input className="form-control mb-3" placeholder="Skills (comma separated)" value={selectedJob?.skills || ""} onChange={e => setSelectedJob({...selectedJob, skills: e.target.value})} />
                      <input className="form-control mb-3" placeholder="Location" value={selectedJob?.location || ""} onChange={e => setSelectedJob({...selectedJob, location: e.target.value})} />
                      <select className="form-select mb-3" value={selectedJob?.jobType || ""} onChange={e => setSelectedJob({...selectedJob, jobType: e.target.value})}><option value="">Job Type</option><option value="full-time">Full Time</option><option value="part-time">Part Time</option><option value="internship">Internship</option><option value="contract">Contract</option></select>
                      <input className="form-control mb-3" placeholder="Salary (e.g. $50,000 - $80,000)" value={selectedJob?.salary || ""} onChange={e => setSelectedJob({...selectedJob, salary: e.target.value})} />
                      <button className="btn btn-primary w-100" disabled={loading}>{loading ? "Posting..." : "Post Job"}</button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* My Jobs */}
            {view === "my-jobs" && user.role === "recruiter" && (
              <div className="fade-in">
                <h4 className="mb-4">📁 My Posted Jobs</h4>
                {myJobs.length === 0 ? <div className="text-center text-muted py-5">No jobs posted yet</div> : (
                  <div className="row">
                    {myJobs.map(job => (
                      <div className="col-md-6 mb-4" key={job._id}>
                        <div className="card">
                          <div className="card-body">
                            <h5>{job.title}</h5>
                            <p className="text-muted">{job.company} • {job.location}</p>
                            <span className="badge bg-success">{job.views} views</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Applicants */}
            {view === "applications" && user.role === "recruiter" && (
              <div className="fade-in">
                <h4 className="mb-4">👥 Job Applicants</h4>
                {applications.length === 0 ? <div className="text-center text-muted py-5">No applications yet</div> : (
                  <div className="table-responsive">
                    <table className="table">
                      <thead><tr><th>Applicant</th><th>Job</th><th>Status</th><th>Date</th></tr></thead>
                      <tbody>
                        {applications.map(app => (
                          <tr key={app._id}>
                            <td>{app.user?.name}<br/><small className="text-muted">{app.user?.email}</small></td>
                            <td>{app.job?.title}</td>
                            <td><span className="badge bg-primary">{app.status}</span></td>
                            <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Resume Analyzer */}
            {view === "analyzer" && user.role === "jobseeker" && (
              <div className="fade-in">
                <h4 className="mb-4">🤖 AI Resume Analyzer</h4>
                <div className="card" style={{maxWidth: 700}}>
                  <div className="card-body">
                    <div className="mb-4 p-3 border rounded" style={{background: "#fef3c7"}}>
                      <h6>📄 Upload PDF Resume</h6>
                      <input type="file" accept=".pdf" className="form-control" onChange={e => setResumeFile(e.target.files[0])} />
                    </div>
                    <div className="text-center my-3 text-muted">- OR -</div>
                    <textarea className="form-control mb-3" rows="6" placeholder="Paste your resume text..." value={resumeText} onChange={e => setResumeText(e.target.value)} />
                    <button className="btn btn-primary" onClick={handleAnalyzeResume} disabled={loading}>{loading ? "Analyzing..." : "Analyze Resume"}</button>
                    {aiResult && <div className="mt-4 p-4 border rounded" style={{background: "#f1f5f9", whiteSpace: "pre-wrap"}}>{aiResult}</div>}
                  </div>
                </div>
              </div>
            )}

            {/* Profile */}
            {view === "profile" && (
              <div className="fade-in">
                <h4 className="mb-4">👤 Edit Profile</h4>
                <div className="card" style={{maxWidth: 600}}>
                  <div className="card-body">
                    <form onSubmit={handleUpdateProfile}>
                      <div className="row">
                        <div className="col-md-6 mb-3"><label className="form-label">Name</label><input className="form-control" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} required /></div>
                        <div className="col-md-6 mb-3"><label className="form-label">Email</label><input className="form-control" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} required /></div>
                        <div className="col-md-6 mb-3"><label className="form-label">Phone</label><input className="form-control" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} /></div>
                        <div className="col-md-6 mb-3"><label className="form-label">Location</label><input className="form-control" value={profile.location} onChange={e => setProfile({...profile, location: e.target.value})} /></div>
                        <div className="col-md-12 mb-3"><label className="form-label">Bio</label><textarea className="form-control" rows="3" value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} /></div>
                        <div className="col-md-12 mb-3"><label className="form-label">Skills</label><input className="form-control" placeholder="JavaScript, React, Python" value={profile.skills} onChange={e => setProfile({...profile, skills: e.target.value})} /></div>
                        <div className="col-md-6 mb-3"><label className="form-label">LinkedIn</label><input className="form-control" value={profile.linkedin} onChange={e => setProfile({...profile, linkedin: e.target.value})} /></div>
                        <div className="col-md-6 mb-3"><label className="form-label">GitHub</label><input className="form-control" value={profile.github} onChange={e => setProfile({...profile, github: e.target.value})} /></div>
                      </div>
                      <button className="btn btn-primary w-100" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Settings */}
            {view === "settings" && (
              <div className="fade-in">
                <h4 className="mb-4">⚙️ Settings</h4>
                <div className="card" style={{maxWidth: 500}}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
                      <div><h6 className="mb-1">Dark Mode</h6><p className="text-muted small mb-0">Toggle theme</p></div>
                      <div className="form-check form-switch"><input className="form-check-input" type="checkbox" checked={darkMode} onChange={() => setDarkMode(!darkMode)} style={{width: 45, height: 24}} /></div>
                    </div>
                    <div className="py-3"><h6>Account</h6><p className="text-muted small">Name: {user.name}<br/>Email: {user.email}<br/>Role: {user.role}</p></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Landing Page */
        <>
          <div className="hero text-center">
            <div className="container">
              <h1 className="display-3 fw-bold mb-4">Find Your Dream Job</h1>
              <p className="lead mb-4">AI-powered job matching & resume analysis</p>
              <div className="search-box mx-auto" style={{maxWidth: 600, background: "white", borderRadius: 12, padding: 20}}>
                <div className="row g-3">
                  <div className="col-md-5"><input className="form-control" placeholder="Job title or keyword" /></div>
                  <div className="col-md-4"><input className="form-control" placeholder="Location" /></div>
                  <div className="col-md-3"><button className="btn btn-primary w-100" onClick={() => {setShowAuth(true); setView("jobs");}}>Search Jobs</button></div>
                </div>
              </div>
            </div>
          </div>
          <div className="container my-5">
            <div className="row">
              {[{icon: "🔍", title: "Smart Search", desc: "Find jobs matching your skills"}, {icon: "🤖", title: "AI Analysis", desc: "Get resume feedback"}, {icon: "📨", title: "Easy Apply", desc: "One-click applications"}, {icon: "💬", title: "Doodle Bot", desc: "24/7 career assistance"}].map((f, i) => (
                <div className="col-md-3 mb-4" key={i}>
                  <div className="card h-100 text-center p-4" style={{borderRadius: 16}}>
                    <div style={{fontSize: "2.5rem", marginBottom: 16}}>{f.icon}</div>
                    <h5>{f.title}</h5>
                    <p className="text-muted">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <footer className="bg-dark text-white text-center py-4"><p className="mb-0">© 2024 Hire Me AI - Final Year Project</p></footer>
        </>
      )}

      {/* Doodle Chatbot */}
      <div className="doodle-chat">
        {chatOpen && (
          <div className="doodle-window fade-in">
            <div className="doodle-header">
              <span style={{fontSize: "1.5rem"}}>🤖</span>
              <div><div className="fw-semibold">Doodle</div><small>AI Career Assistant</small></div>
            </div>
            <div className="doodle-messages">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`doodle-msg ${msg.from}`}>{msg.text}</div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="doodle-input">
              <input placeholder="Ask Doodle anything..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChatMessage()} disabled={loading} />
              <button onClick={sendChatMessage} disabled={loading}>Send</button>
            </div>
          </div>
        )}
        <button className="doodle-btn" onClick={() => setChatOpen(!chatOpen)}>{chatOpen ? "✕" : "💬"}</button>
      </div>
    </>
  );
}

export default App;