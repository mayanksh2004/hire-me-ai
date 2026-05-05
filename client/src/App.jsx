import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [jobs, setJobs] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("jobseeker");

  useEffect(() => {
    fetchJobs();
    if (token) {
      fetchUser();
    }
  }, [token]);

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

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Hire Me AI</h1>
        {user && <button onClick={logout}>Logout ({user.name})</button>}
      </div>

      {error && (
        <div style={{ color: "red", padding: "10px", background: "#fee", marginBottom: "10px" }}>
          {error}
          <button onClick={() => setError("")} style={{ marginLeft: "10px" }}>X</button>
        </div>
      )}

      {!token ? (
        <div style={{ border: "1px solid #ccc", padding: "20px", marginBottom: "20px" }}>
          <h2>{showRegister ? "Register" : "Login"}</h2>
          <form onSubmit={showRegister ? handleRegister : handleLogin}>
            {showRegister && (
              <>
                <input
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{ display: "block", marginBottom: "10px", padding: "8px", width: "100%" }}
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ display: "block", marginBottom: "10px", padding: "8px", width: "100%" }}
                >
                  <option value="jobseeker">Job Seeker</option>
                  <option value="recruiter">Recruiter</option>
                </select>
              </>
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ display: "block", marginBottom: "10px", padding: "8px", width: "100%" }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ display: "block", marginBottom: "10px", padding: "8px", width: "100%" }}
            />
            <button type="submit" disabled={loading}>
              {loading ? "Loading..." : showRegister ? "Register" : "Login"}
            </button>
          </form>
          <p>
            {showRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <button onClick={() => { setShowRegister(!showRegister); setError(""); }}>
              {showRegister ? "Login" : "Register"}
            </button>
          </p>
        </div>
      ) : null}

      <h2>Available Jobs</h2>
      {jobs.length === 0 ? (
        <p>No jobs available</p>
      ) : (
        jobs.map((job) => (
          <div
            key={job._id}
            style={{ border: "1px solid #ccc", margin: "10px 0", padding: "15px" }}
          >
            <h3>{job.title}</h3>
            <p><strong>Company:</strong> {job.company}</p>
            <p>{job.description}</p>
            {job.skillsRequired?.length > 0 && (
              <p><strong>Skills:</strong> {job.skillsRequired.join(", ")}</p>
            )}
            {user?.role === "jobseeker" && (
              <button onClick={() => applyJob(job._id)}>Apply</button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default App;