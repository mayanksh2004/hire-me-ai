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
  const [success, setSuccess] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "", role: "jobseeker" });
  const [jobs, setJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState({ keyword: "", jobType: "", location: "" });
  const [selectedJob, setSelectedJob] = useState(null);
  const [profile, setProfile] = useState({ name: "", email: "", phone: "", location: "", bio: "", skills: "", linkedin: "", github: "", website: "" });
  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [aiResult, setAiResult] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([{ from: "bot", text: "Hi! I'm Doodle, your AI career assistant! 🤖 How can I help you today?" }]);
  const [chatInput, setChatInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => { document.body.className = darkMode ? "dark" : "light"; localStorage.setItem("darkMode", darkMode); }, [darkMode]);
  useEffect(() => { if (token) fetchUser(); }, [token]);
  useEffect(() => { if (user) { fetchJobs(); if (user.role === "recruiter") { fetchMyJobs(); fetchAllApplications(); } else fetchMyApplications(); } }, [user]);
  useEffect(() => { if (chatOpen && chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" }); }, [chatMessages, chatOpen]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setUser(data); setProfile({ name: data.name || "", email: data.email || "", phone: data.phone || "", location: data.location || "", bio: data.bio || "", skills: data.skills || "", linkedin: data.linkedin || "", github: data.github || "", website: data.website || "" }); }
      else logout();
    } catch (err) { console.error(err); }
  };

  const fetchJobs = async () => {
    try { const params = new URLSearchParams(); if (search.keyword) params.append("search", search.keyword); if (search.jobType) params.append("jobType", search.jobType); if (search.location) params.append("location", search.location);
      const res = await fetch(`${API_URL}/api/jobs?${params}`); const data = await res.json(); setJobs(data.jobs || []);
    } catch (err) { console.error(err); }
  };

  const fetchMyJobs = async () => { try { const res = await fetch(`${API_URL}/api/jobs/my-jobs`, { headers: { Authorization: `Bearer ${token}` } }); setMyJobs(await res.json()); } catch (err) { console.error(err); } };
  const fetchMyApplications = async () => { try { const res = await fetch(`${API_URL}/api/applications/my`, { headers: { Authorization: `Bearer ${token}` } }); setApplications(await res.json()); } catch (err) { console.error(err); } };
  const fetchAllApplications = async () => { try { const res = await fetch(`${API_URL}/api/applications/all`, { headers: { Authorization: `Bearer ${token}` } }); setApplications(await res.json()); } catch (err) { console.error(err); } };

  const handleAuth = async (e) => {
    e.preventDefault(); setLoading(true); setError("");
    try { const res = await fetch(`${API_URL}/api/auth/${isLogin ? "login" : "register"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(authForm) });
      const data = await res.json(); if (res.ok) { localStorage.setItem("token", data.token); setToken(data.token); setUser(data.user); setShowAuth(false); showSuccess(isLogin ? "Welcome back! 🎉" : "Account created! 🚀"); } else showError(data.message);
    } catch (err) { showError("Network error. Please try again."); } setLoading(false);
  };

  const logout = () => { localStorage.removeItem("token"); setToken(""); setUser(null); setView("home"); };
  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 4000); };
  const showError = (msg) => { setError(msg); setTimeout(() => setError(""), 5000); };
  const Spinner = () => <span className="spinner-border spinner-border-sm me-2" role="status"></span>;

  const handlePostJob = async (e) => { e.preventDefault(); setLoading(true); try { const res = await fetch(`${API_URL}/api/jobs`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...selectedJob, title: selectedJob?.title, company: selectedJob?.company, description: selectedJob?.description, skillsRequired: selectedJob?.skills?.split(",").map(s => s.trim()) }) }); if (res.ok) { showSuccess("Job posted successfully! 🎉"); fetchMyJobs(); setView("my-jobs"); setSelectedJob({}); } else showError("Failed to post job"); } catch (err) { showError("Something went wrong"); } setLoading(false); };
  const handleApply = async (jobId) => { if (!token) return setShowAuth(true); setLoading(true); try { const res = await fetch(`${API_URL}/api/applications/${jobId}`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }); const data = await res.json(); if (res.ok) showSuccess("Application submitted! ✅"); else showError(data.message || "Failed to apply"); } catch (err) { showError("Something went wrong"); } setLoading(false); };
  const handleUpdateProfile = async (e) => { e.preventDefault(); setLoading(true); try { const res = await fetch(`${API_URL}/api/auth/profile`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(profile) }); if (res.ok) { showSuccess("Profile updated successfully! ✨"); fetchUser(); } else showError("Failed to update profile"); } catch (err) { showError("Something went wrong"); } setLoading(false); };

  const handleAnalyzeResume = async () => { if (!resumeText && !resumeFile) return showError("Please enter text or upload a PDF"); setLoading(true); try { if (resumeFile) { const formData = new FormData(); formData.append("resume", resumeFile); const res = await fetch(`${API_URL}/api/ai/analyze-file`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData }); const data = await res.json(); if (res.ok) { setAiResult(data.result); showSuccess("Resume analyzed! 📊"); } else showError(data.message); } else { const res = await fetch(`${API_URL}/api/ai/analyze`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ resumeText }) }); const data = await res.json(); if (res.ok) { setAiResult(data.result); showSuccess("Resume analyzed! 📊"); } else showError(data.message); } } catch (err) { showError("Analysis failed. Please try again."); } setLoading(false); };

  const sendChatMessage = async () => { if (!chatInput.trim()) return; const userMsg = { from: "user", text: chatInput }; setChatMessages(prev => [...prev, userMsg]); setChatInput(""); setLoading(true); try { const res = await fetch(`${API_URL}/api/ai/doodle`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ message: chatInput, history: chatMessages }) }); const data = await res.json(); setChatMessages(prev => [...prev, { from: "bot", text: data.response }]); } catch (err) { setChatMessages(prev => [...prev, { from: "bot", text: "Oops! Something went wrong. Try again! 😅" }]); } setLoading(false); };

  const jobTypeColors = { "full-time": "#22c55e", "part-time": "#3b82f6", "internship": "#f59e0b", "contract": "#8b5cf6" };
  const getTimeAgo = (date) => { const diff = Date.now() - new Date(date).getTime(); const hours = Math.floor(diff / 3600000); if (hours < 1) return "Just now"; if (hours < 24) return `${hours}h ago`; const days = Math.floor(hours / 24); if (days < 7) return `${days}d ago`; return `${Math.floor(days / 7)}w ago`; };

  const styles = { css: `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
    * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }
    :root { --primary: #f97316; --primary-dark: #ea580c; --primary-light: #fed7aa; --bg: #f8fafc; --surface: #ffffff; --text: #1e293b; --text-muted: #64748b; --border: #e2e8f0; --shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1); --shadow-lg: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1); }
    body.light { background: var(--bg); color: var(--text); }
    body.dark { background: #0f172a; color: #e2e8f0; --bg: #1e293b; --surface: #334155; --text: #e2e8f0; --text-muted: #94a3b8; --border: #475569; --shadow: 0 4px 6px -1px rgba(0,0,0,0.3); }
    body.dark .card { background: var(--surface); border-color: var(--border); }
    body.dark input, body.dark textarea, body.dark select { background: #334155; border-color: #475569; color: #e2e8f0; }
    body.dark .auth-box { background: #1e293b; }
    
    .navbar { background: linear-gradient(135deg, #fff 0%, #fafafa 100%) !important; box-shadow: var(--shadow); backdrop-filter: blur(10px); }
    body.dark .navbar { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%) !important; border-bottom: 1px solid var(--border); }
    .navbar-brand { background: linear-gradient(135deg, #f97316, #fb923c); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; font-size: 1.6rem; letter-spacing: -0.5px; }
    
    .hero { background: linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%); position: relative; overflow: hidden; }
    .hero::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 50%); animation: float 20s linear infinite; }
    @keyframes float { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .hero h1 { font-size: 3.5rem; font-weight: 800; letter-spacing: -1px; animation: slideUp 0.8s ease-out; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    .search-box { background: rgba(255,255,255,0.15); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.2); border-radius: 20px; padding: 8px; }
    .search-box input { background: white; border: none; border-radius: 12px; padding: 14px 20px; font-size: 1rem; }
    .search-box input:focus { box-shadow: 0 0 0 3px rgba(255,255,255,0.3); }
    .search-box button { background: #1e293b; color: white; border: none; border-radius: 12px; padding: 14px 28px; font-weight: 600; }
    
    .feature-card { background: var(--surface); border-radius: 24px; padding: 32px 24px; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); border: 1px solid var(--border); }
    .feature-card:hover { transform: translateY(-10px); box-shadow: var(--shadow-lg); border-color: var(--primary); }
    .feature-card .icon { width: 70px; height: 70px; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin-bottom: 20px; }
    
    .sidebar { background: var(--surface); border-right: 1px solid var(--border); width: 280px; padding: 0; position: fixed; height: 100vh; overflow-y: auto; z-index: 1000; transform: translateX(-100%); transition: transform 0.3s ease; }
    .sidebar.show { transform: translateX(0); }
    .sidebar-header { background: linear-gradient(135deg, #f97316, #fb923c); padding: 30px 24px; color: white; }
    .sidebar-avatar { width: 70px; height: 70px; border-radius: 20px; background: rgba(255,255,255,0.2); border: 3px solid rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: 700; margin-bottom: 12px; }
    .sidebar-menu { padding: 16px; }
    .sidebar-item { display: flex; align-items: center; gap: 14px; padding: 14px 18px; border-radius: 14px; margin-bottom: 6px; color: var(--text-muted); font-weight: 500; transition: all 0.2s; cursor: pointer; }
    .sidebar-item:hover, .sidebar-item.active { background: linear-gradient(135deg, #fef3c7, #fed7aa); color: #c2410c; }
    body.dark .sidebar-item:hover, body.dark .sidebar-item.active { background: linear-gradient(135deg, #7c2d12, #9a3412); color: white; }
    
    .main-content { margin-left: 0; transition: margin 0.3s; padding: 30px; min-height: 100vh; }
    @media (min-width: 992px) { .main-content { margin-left: 280px; } }
    
    .job-card { background: var(--surface); border-radius: 20px; padding: 24px; margin-bottom: 20px; border: 1px solid var(--border); transition: all 0.3s ease; cursor: pointer; }
    .job-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: var(--primary); }
    .job-card .company-logo { width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg, #fef3c7, #fde68a); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; font-weight: 700; color: #b45309; }
    body.dark .job-card .company-logo { background: linear-gradient(135deg, #7c2d12, #c2410c); color: #fed7aa; }
    .job-type-badge { padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .skill-tag { background: linear-gradient(135deg, #fef3c7, #fed7aa); color: #c2410c; padding: 6px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 500; }
    body.dark .skill-tag { background: linear-gradient(135deg, #7c2d12, #9a3412); color: #fed7aa; }
    
    .btn-primary { background: linear-gradient(135deg, #f97316, #ea580c); border: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; transition: all 0.3s; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(249,115,22,0.3); }
    .btn-primary:active { transform: translateY(0); }
    
    .auth-modal { background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); }
    .auth-box { background: var(--surface); border-radius: 28px; padding: 40px; max-width: 440px; width: 90%; box-shadow: var(--shadow-lg); }
    .auth-box input { border-radius: 12px; padding: 14px 16px; border: 2px solid var(--border); transition: all 0.2s; }
    .auth-box input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(249,115,22,0.1); }
    
    .doodle-chat { position: fixed; bottom: 30px; right: 30px; z-index: 999; }
    .doodle-btn { width: 65px; height: 65px; border-radius: 50%; background: linear-gradient(135deg, #f97316, #ea580c); border: none; color: white; font-size: 1.8rem; cursor: pointer; box-shadow: 0 8px 30px rgba(249,115,22,0.4); transition: all 0.3s; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
    .doodle-btn:hover { transform: scale(1.1); }
    .doodle-window { position: absolute; bottom: 85px; right: 0; width: 400px; height: 550px; background: var(--surface); border-radius: 24px; box-shadow: var(--shadow-lg); overflow: hidden; border: 1px solid var(--border); }
    .doodle-header { background: linear-gradient(135deg, #f97316, #ea580c); padding: 20px 24px; display: flex; align-items: center; gap: 14px; }
    .doodle-messages { height: 400px; padding: 20px; overflow-y: auto; }
    .doodle-msg { max-width: 85%; padding: 14px 18px; border-radius: 18px; margin-bottom: 12px; animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .doodle-msg.bot { background: linear-gradient(135deg, #f1f5f9, #e2e8f0); color: var(--text); border-bottom-left-radius: 4px; }
    body.dark .doodle-msg.bot { background: linear-gradient(135deg, #334155, #475569); color: #e2e8f0; }
    .doodle-msg.user { background: linear-gradient(135deg, #f97316, #ea580c); color: white; margin-left: auto; border-bottom-right-radius: 4px; }
    .doodle-input { padding: 16px 20px; border-top: 1px solid var(--border); display: flex; gap: 12px; }
    .doodle-input input { flex: 1; border-radius: 12px; padding: 12px 16px; border: 2px solid var(--border); }
    .doodle-input button { background: linear-gradient(135deg, #f97316, #ea580c); border: none; border-radius: 12px; padding: 12px 20px; color: white; font-weight: 600; }
    
    .stats-card { background: linear-gradient(135deg, #fef3c7, #fed7aa); border-radius: 20px; padding: 24px; text-align: center; }
    body.dark .stats-card { background: linear-gradient(135deg, #7c2d12, #c2410c); }
    .stats-number { font-size: 2.5rem; font-weight: 800; color: #c2410c; }
    body.dark .stats-number { color: #fed7aa; }
    
    .section-title { font-size: 1.8rem; font-weight: 700; margin-bottom: 24px; position: relative; display: inline-block; }
    .section-title::after { content: ''; position: absolute; bottom: -8px; left: 0; width: 60px; height: 4px; background: linear-gradient(135deg, #f97316, #ea580c); border-radius: 2px; }
    
    .mobile-menu-btn { display: none; }
    @media (max-width: 991px) { .mobile-menu-btn { display: block; } .sidebar { width: 100%; } }
    
    .form-control, .form-select { border-radius: 12px; padding: 12px 16px; border: 2px solid var(--border); transition: all 0.2s; }
    .form-control:focus, .form-select:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(249,115,22,0.1); }
    
    .table { border-radius: 16px; overflow: hidden; }
    .table thead { background: linear-gradient(135deg, #fef3c7, #fed7aa); }
    body.dark .table thead { background: linear-gradient(135deg, #7c2d12, #9a3412); }
    
    .fade-in { animation: fadeIn 0.5s ease; }
    
    .toast-container { position: fixed; top: 100px; right: 20px; z-index: 9999; }
    .toast-msg { padding: 16px 24px; border-radius: 12px; margin-bottom: 10px; animation: slideIn 0.3s ease; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
    .toast-success { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; }
    .toast-error { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; }
    .toast-loading { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; }
    @keyframes slideIn { from { opacity: 0; transform: translateX(100px); } to { opacity: 1; transform: translateX(0); } }
    
    .loading-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; }
    .loading-spinner { width: 50px; height: 50px; border: 5px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `};

  return (
    <>
      <style>{styles.css}</style>
      
      {/* Toast Notifications */}
      <div className="toast-container">
        {loading && <div className="toast-msg toast-loading d-flex align-items-center"><Spinner /> Processing...</div>}
        {error && <div className="toast-msg toast-error d-flex align-items-center"><span className="me-2">⚠️</span>{error}<button className="btn-close btn-close-white ms-3" onClick={() => setError("")}></button></div>}
        {success && <div className="toast-msg toast-success d-flex align-items-center"><span className="me-2">✅</span>{success}<button className="btn-close btn-close-white ms-3" onClick={() => setSuccess("")}></button></div>}
      </div>

      {/* Loading Overlay */}
      {loading && <div className="loading-overlay"><div className="loading-spinner"></div></div>}
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Auth Modal */}
      {showAuth && <div className="auth-modal position-fixed top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center z-1000" onClick={() => setShowAuth(false)}>
        <div className="auth-box" onClick={e => e.stopPropagation()}>
          <div className="text-center mb-4"><h2 className="fw-bold">{isLogin ? "Welcome Back" : "Create Account"}</h2><p className="text-muted">Start your career journey with us</p></div>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleAuth}>
            {!isLogin && <input className="form-control mb-3" placeholder="Full Name" value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} required />}
            {!isLogin && <select className="form-select mb-3" value={authForm.role} onChange={e => setAuthForm({...authForm, role: e.target.value})}><option value="jobseeker">Job Seeker</option><option value="recruiter">Recruiter</option></select>}
            <input className="form-control mb-3" type="email" placeholder="Email Address" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} required />
            <input className="form-control mb-4" type="password" placeholder="Password" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} required />
            <button className="btn btn-primary w-100 py-3" disabled={loading}>{loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}</button>
          </form>
          <p className="text-center mt-4">{isLogin ? "Don't have an account?" : "Already have an account?"} <span style={{color: "#f97316", cursor: "pointer", fontWeight: 600}} onClick={() => {setIsLogin(!isLogin); setError("");}}>{isLogin ? "Sign Up" : "Sign In"}</span></p>
        </div>
      </div>}

      {/* Navbar */}
      <nav className="navbar navbar-expand-lg py-3 position-sticky top-0 z-999">
        <div className="container-fluid px-4">
          <button className="btn d-lg-none mobile-menu-btn me-2" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <a className="navbar-brand" href="#" onClick={() => setView("home")}>⚡ Hire Me AI</a>
          <div className="d-flex align-items-center gap-3">
            <button className="btn btn-outline-secondary rounded-pill px-3" onClick={() => setDarkMode(!darkMode)}>{darkMode ? "☀️" : "🌙"}</button>
            {user ? <><span className="fw-semibold d-none d-md-block">{user.name}</span><button className="btn btn-outline-danger rounded-pill px-3" onClick={logout}>Logout</button></> : <button className="btn btn-primary rounded-pill px-4" onClick={() => setShowAuth(true)}>Get Started →</button>}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {user ? (
        <div className="d-flex">
          {/* Sidebar */}
          <div className={`sidebar ${sidebarOpen ? 'show' : ''}`} style={{background: darkMode ? '#1e293b' : 'white'}}>
            <div className="sidebar-header">
              <div className="sidebar-avatar">{user.name?.charAt(0)}</div>
              <div className="fw-bold" style={{fontSize: '1.2rem'}}>{user.name}</div>
              <div className="opacity-75 text-capitalize" style={{fontSize: '0.9rem'}}>{user.role}</div>
              <div className="opacity-75 small mt-1">{user.email}</div>
            </div>
            <div className="sidebar-menu">
              <div className={`sidebar-item ${view === "jobs" ? "active" : ""}`} onClick={() => setView("jobs")}><span>🔍</span> Browse Jobs</div>
              {user.role === "jobseeker" && <><div className={`sidebar-item ${view === "applied" ? "active" : ""}`} onClick={() => setView("applied")}><span>📨</span> My Applications</div><div className={`sidebar-item ${view === "analyzer" ? "active" : ""}`} onClick={() => setView("analyzer")}><span>🤖</span> AI Resume Analyzer</div></>}
              {user.role === "recruiter" && <><div className={`sidebar-item ${view === "post" ? "active" : ""}`} onClick={() => setView("post")}><span>➕</span> Post a Job</div><div className={`sidebar-item ${view === "my-jobs" ? "active" : ""}`} onClick={() => setView("my-jobs")}><span>📁</span> My Posted Jobs</div><div className={`sidebar-item ${view === "applications" ? "active" : ""}`} onClick={() => setView("applications")}><span>👥</span> Applicants</div></>}
              <div className={`sidebar-item ${view === "profile" ? "active" : ""}`} onClick={() => setView("profile")}><span>👤</span> Edit Profile</div>
              <div className={`sidebar-item ${view === "settings" ? "active" : ""}`} onClick={() => setView("settings")}><span>⚙️</span> Settings</div>
            </div>
          </div>

          {/* Views */}
          <div className="main-content">
            {error && <div className="alert alert-danger d-flex align-items-center justify-content-between">{error}<button className="btn-close" onClick={() => setError("")}></button></div>}
            
            {/* Jobs View */}
            {view === "jobs" && <div className="fade-in">
              <h4 className="section-title mb-4">🔍 Browse Jobs</h4>
              <div className="row g-3 mb-4">
                <div className="col-lg-4"><input className="form-control" placeholder="Search by title, company..." value={search.keyword} onChange={e => setSearch({...search, keyword: e.target.value})} /></div>
                <div className="col-lg-3"><select className="form-select" value={search.jobType} onChange={e => setSearch({...search, jobType: e.target.value})}><option value="">All Types</option><option value="full-time">Full Time</option><option value="part-time">Part Time</option><option value="internship">Internship</option><option value="contract">Contract</option></select></div>
                <div className="col-lg-3"><input className="form-control" placeholder="Location" value={search.location} onChange={e => setSearch({...search, location: e.target.value})} /></div>
                <div className="col-lg-2"><button className="btn btn-primary w-100" onClick={fetchJobs}>Search</button></div>
              </div>
              <div className="row">{jobs.length === 0 ? <div className="col-12 text-center py-5"><h5 className="text-muted">No jobs found 😔</h5></div> : jobs.map(job => (
                <div className="col-lg-6" key={job._id}>
                  <div className="job-card">
                    <div className="d-flex align-items-start gap-3 mb-3">
                      <div className="company-logo">{job.company?.charAt(0)}</div>
                      <div className="flex-grow-1">
                        <h5 className="mb-1 fw-bold">{job.title}</h5>
                        <p className="text-muted mb-2">{job.company} • {job.location}</p>
                        <div className="d-flex align-items-center gap-2"><span className="job-type-badge" style={{background: jobTypeColors[job.jobType], color: 'white'}}>{job.jobType}</span><span className="text-muted small">⏰ {getTimeAgo(job.createdAt)}</span></div>
                      </div>
                    </div>
                    <p className="text-muted mb-3" style={{fontSize: '0.95rem'}}>{job.description?.substring(0, 150)}...</p>
                    <div className="d-flex flex-wrap gap-2 mb-3">{job.skillsRequired?.slice(0,4).map((s, i) => <span key={i} className="skill-tag">{s}</span>)}</div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted small">👁 {job.views} views</span>
                      {user.role === "jobseeker" && <button className="btn btn-primary btn-sm" onClick={() => handleApply(job._id)}>Apply Now →</button>}
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>}

            {/* My Applications */}
            {view === "applied" && user.role === "jobseeker" && <div className="fade-in">
              <h4 className="section-title mb-4">📨 My Applications</h4>
              {applications.length === 0 ? <div className="text-center py-5"><h5 className="text-muted">No applications yet 😔</h5><p className="text-muted">Start applying to jobs to see them here</p></div> : (
                <div className="table-responsive"><table className="table"><thead><tr><th>Job</th><th>Company</th><th>Status</th><th>Date</th></tr></thead><tbody>
                  {applications.map(app => <tr key={app._id}><td className="fw-semibold">{app.job?.title}</td><td>{app.job?.company}</td><td><span className={`badge ${app.status === 'hired' ? 'bg-success' : app.status === 'rejected' ? 'bg-danger' : app.status === 'shortlisted' ? 'bg-info' : 'bg-warning'}`}>{app.status}</span></td><td className="text-muted">{new Date(app.createdAt).toLocaleDateString()}</td></tr>)}
                </tbody></table></div>
              )}
            </div>}

            {/* Post Job */}
            {view === "post" && user.role === "recruiter" && <div className="fade-in">
              <h4 className="section-title mb-4">➕ Post a New Job</h4>
              <div className="card" style={{maxWidth: 600}}><div className="card-body p-4">
                <form onSubmit={handlePostJob}>
                  <div className="mb-3"><label className="form-label fw-semibold">Job Title *</label><input className="form-control" placeholder="e.g. Senior Software Engineer" value={selectedJob?.title || ""} onChange={e => setSelectedJob({...selectedJob, title: e.target.value})} required /></div>
                  <div className="mb-3"><label className="form-label fw-semibold">Company Name *</label><input className="form-control" placeholder="e.g. Google" value={selectedJob?.company || ""} onChange={e => setSelectedJob({...selectedJob, company: e.target.value})} required /></div>
                  <div className="mb-3"><label className="form-label fw-semibold">Job Description *</label><textarea className="form-control" rows="4" placeholder="Describe the role, responsibilities..." value={selectedJob?.description || ""} onChange={e => setSelectedJob({...selectedJob, description: e.target.value})} required /></div>
                  <div className="mb-3"><label className="form-label fw-semibold">Skills Required</label><input className="form-control" placeholder="JavaScript, React, Node.js (comma separated)" value={selectedJob?.skills || ""} onChange={e => setSelectedJob({...selectedJob, skills: e.target.value})} /></div>
                  <div className="row"><div className="col-md-6 mb-3"><label className="form-label fw-semibold">Location</label><input className="form-control" placeholder="e.g. Mumbai, India" value={selectedJob?.location || ""} onChange={e => setSelectedJob({...selectedJob, location: e.target.value})} /></div><div className="col-md-6 mb-3"><label className="form-label fw-semibold">Job Type</label><select className="form-select" value={selectedJob?.jobType || ""} onChange={e => setSelectedJob({...selectedJob, jobType: e.target.value})}><option value="">Select type</option><option value="full-time">Full Time</option><option value="part-time">Part Time</option><option value="internship">Internship</option><option value="contract">Contract</option></select></div></div>
                  <div className="mb-4"><label className="form-label fw-semibold">Salary Range</label><input className="form-control" placeholder="e.g. ₹5,00,000 - ₹10,00,000" value={selectedJob?.salary || ""} onChange={e => setSelectedJob({...selectedJob, salary: e.target.value})} /></div>
                  <button className="btn btn-primary w-100 py-3" disabled={loading}>{loading ? "Posting..." : "🚀 Post Job"}</button>
                </form>
              </div></div>
            </div>}

            {/* My Jobs */}
            {view === "my-jobs" && user.role === "recruiter" && <div className="fade-in">
              <h4 className="section-title mb-4">📁 My Posted Jobs</h4>
              <div className="row">{myJobs.length === 0 ? <div className="col-12 text-center py-5"><h5 className="text-muted">No jobs posted yet 😔</h5></div> : myJobs.map(job => (
                <div className="col-md-6 mb-4" key={job._id}><div className="job-card"><h5 className="fw-bold">{job.title}</h5><p className="text-muted">{job.company} • {job.location}</p><div className="d-flex gap-2"><span className="badge bg-success">{job.views} views</span><span className="badge bg-primary">{job.applicationsCount || 0} applicants</span></div></div></div>
              ))}
              </div>
            </div>}

            {/* Applicants */}
            {view === "applications" && user.role === "recruiter" && <div className="fade-in">
              <h4 className="section-title mb-4">👥 Job Applicants</h4>
              {applications.length === 0 ? <div className="text-center py-5"><h5 className="text-muted">No applicants yet 😔</h5></div> : (
                <div className="table-responsive"><table className="table"><thead><tr><th>Applicant</th><th>Job</th><th>Status</th><th>Date</th></tr></thead><tbody>
                  {applications.map(app => <tr key={app._id}><td><div className="fw-semibold">{app.user?.name}</div><small className="text-muted">{app.user?.email}</small></td><td>{app.job?.title}</td><td><span className="badge bg-primary">{app.status}</span></td><td className="text-muted">{new Date(app.createdAt).toLocaleDateString()}</td></tr>)}
                </tbody></table></div>
              )}
            </div>}

            {/* Resume Analyzer */}
            {view === "analyzer" && user.role === "jobseeker" && <div className="fade-in">
              <h4 className="section-title mb-4">🤖 AI Resume Analyzer</h4>
              <div className="card" style={{maxWidth: 700}}><div className="card-body p-4">
                <div className="mb-4 p-4 rounded" style={{background: 'linear-gradient(135deg, #fef3c7, #fed7aa)'}}><h6 className="fw-bold mb-3">📄 Upload PDF Resume</h6><input type="file" accept=".pdf" className="form-control" onChange={e => setResumeFile(e.target.files[0])} /></div>
                <div className="text-center my-3 text-muted fw-medium">— OR —</div>
                <textarea className="form-control mb-3" rows="6" placeholder="Paste your resume text here..." value={resumeText} onChange={e => setResumeText(e.target.value)} />
                <button className="btn btn-primary py-3 px-4" onClick={handleAnalyzeResume} disabled={loading}>{loading ? "Analyzing..." : "✨ Analyze with AI"}</button>
                {aiResult && <div className="mt-4 p-4 rounded" style={{background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', whiteSpace: 'pre-wrap'}}>{aiResult}</div>}
              </div></div>
            </div>}

            {/* Profile */}
            {view === "profile" && <div className="fade-in">
              <h4 className="section-title mb-4">👤 Edit Profile</h4>
              <div className="card" style={{maxWidth: 600}}><div className="card-body p-4">
                <div className="text-center mb-4"><div style={{width: 100, height: 100, borderRadius: 24, background: 'linear-gradient(135deg, #f97316, #fb923c)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2.5rem', fontWeight: 700, margin: '0 auto 16px'}}>{user.name?.charAt(0)}</div><h4 className="mb-0">{user.name}</h4><p className="text-muted text-capitalize">{user.role}</p></div>
                <form onSubmit={handleUpdateProfile}>
                  <div className="row"><div className="col-md-6 mb-3"><label className="form-label fw-semibold">Full Name</label><input className="form-control" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} /></div><div className="col-md-6 mb-3"><label className="form-label fw-semibold">Email</label><input className="form-control" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} /></div></div>
                  <div className="row"><div className="col-md-6 mb-3"><label className="form-label fw-semibold">Phone</label><input className="form-control" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} /><div className="col-md-6 mb-3"><label className="form-label fw-semibold">Location</label><input className="form-control" value={profile.location} onChange={e => setProfile({...profile, location: e.target.value})} /></div></div>
                  <div className="mb-3"><label className="form-label fw-semibold">Bio</label><textarea className="form-control" rows="3" placeholder="Tell us about yourself..." value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} /></div>
                  <div className="mb-3"><label className="form-label fw-semibold">Skills</label><input className="form-control" placeholder="JavaScript, React, Python..." value={profile.skills} onChange={e => setProfile({...profile, skills: e.target.value})} /></div>
                  <div className="row"><div className="col-md-6 mb-3"><label className="form-label fw-semibold">LinkedIn</label><input className="form-control" value={profile.linkedin} onChange={e => setProfile({...profile, linkedin: e.target.value})} /><div className="col-md-6 mb-3"><label className="form-label fw-semibold">GitHub</label><input className="form-control" value={profile.github} onChange={e => setProfile({...profile, github: e.target.value})} /></div></div>
                  <button className="btn btn-primary w-100 py-3" disabled={loading}>{loading ? "Saving..." : "💾 Save Changes"}</button>
                </form>
              </div></div>
            </div>}

            {/* Settings */}
            {view === "settings" && <div className="fade-in">
              <h4 className="section-title mb-4">⚙️ Settings</h4>
              <div className="card" style={{maxWidth: 500}}><div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center py-3 border-bottom"><div><h6 className="mb-1">Dark Mode</h6><p className="text-muted small mb-0">Toggle between light and dark theme</p></div><div className="form-check form-switch"><input className="form-check-input" type="checkbox" checked={darkMode} onChange={() => setDarkMode(!darkMode)} style={{width: 50, height: 26}} /></div></div>
                <div className="py-3 border-bottom"><h6>📊 Account Statistics</h6><div className="row mt-3"><div className="col-4"><div className="stats-card"><div className="stats-number">{jobs.length}</div><small>Total Jobs</small></div></div><div className="col-4"><div className="stats-card"><div className="stats-number">{applications.length}</div><small>Applications</small></div></div><div className="col-4"><div className="stats-card"><div className="stats-number">1</div><small>Profile</small></div></div></div></div>
                <div className="py-3"><h6>ℹ️ About</h6><p className="text-muted small mb-0">Hire Me AI v2.0<br/>Your AI-powered career companion<br/>© 2024 All rights reserved</p></div>
              </div></div>
            </div>}
          </div>
        </div>
      ) : (
        /* Landing Page */
        <>
          <div className="hero text-center py-5">
            <div className="container py-5">
              <h1 className="display-3 fw-bold mb-4">Find Your <span style={{color: '#fef3c7'}}>Dream Job</span></h1>
              <p className="lead mb-5" style={{opacity: 0.9, fontSize: '1.2rem'}}>AI-powered job matching & resume analysis to accelerate your career</p>
              <div className="search-box mx-auto mb-5" style={{maxWidth: 700}}>
                <div className="row g-2">
                  <div className="col-md-5"><input className="form-control" placeholder="Job title, keywords..." /></div>
                  <div className="col-md-4"><input className="form-control" placeholder="City, state, or remote" /></div>
                  <div className="col-md-3"><button className="btn w-100" onClick={() => {setShowAuth(true); setView("jobs");}}>Search Jobs</button></div>
                </div>
              </div>
              <div className="d-flex justify-content-center gap-4 flex-wrap"><span className="badge bg-white bg-opacity-25 py-2 px-4 rounded-pill">🚀 10,000+ Jobs</span><span className="badge bg-white bg-opacity-25 py-2 px-4 rounded-pill">🤖 AI Powered</span><span className="badge bg-white bg-opacity-25 py-2 px-4 rounded-pill">💬 Doodle Bot</span></div>
            </div>
          </div>
          <div className="container my-5 py-5">
            <div className="text-center mb-5"><h2 className="fw-bold">Why Choose Hire Me AI?</h2><p className="text-muted">Everything you need to land your dream job</p></div>
            <div className="row g-4">
              {[{icon: "🔍", title: "Smart Job Search", desc: "Find jobs that match your skills and preferences with AI", color: "#fef3c7"}, {icon: "🤖", title: "AI Resume Analysis", desc: "Get instant feedback on your resume from AI", color: "#dbeafe"}, {icon: "📨", title: "Easy Applications", desc: "One-click apply to multiple jobs instantly", color: "#dcfce7"}, {icon: "💬", title: "Doodle Bot", desc: "24/7 AI career assistant for all your queries", color: "#fce7f3"}].map((f, i) => (
                <div className="col-md-3" key={i}><div className="feature-card h-100 text-center"><div className="icon mx-auto mb-3" style={{background: f.color}}>{f.icon}</div><h5 className="mb-2">{f.title}</h5><p className="text-muted mb-0">{f.desc}</p></div></div>
              ))}
            </div>
          </div>
          <footer className="bg-dark text-white text-center py-4"><p className="mb-0">© 2024 Hire Me AI - Your Dream Job Awaits 🚀</p></footer>
        </>
      )}

      {/* Doodle Chatbot */}
      <div className="doodle-chat">
        {chatOpen && <div className="doodle-window fade-in">
          <div className="doodle-header"><span style={{fontSize: "2rem"}}>🤖</span><div><div className="fw-bold">Doodle</div><small>AI Career Assistant</small></div></div>
          <div className="doodle-messages">{chatMessages.map((msg, i) => <div key={i} className={`doodle-msg ${msg.from}`}>{msg.text}</div>)}<div ref={chatEndRef} /></div>
          <div className="doodle-input"><input placeholder="Ask Doodle anything..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChatMessage()} disabled={loading} /><button onClick={sendChatMessage} disabled={loading}>Send</button></div>
        </div>}
        <button className="doodle-btn" onClick={() => setChatOpen(!chatOpen)}>{chatOpen ? "✕" : "💬"}</button>
      </div>
    </>
  );
}

export default App;