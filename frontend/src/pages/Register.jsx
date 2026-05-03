import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthPages.css";
import { useEffect } from "react";
import { toast } from "react-toastify";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [blockedUntill , setBlockedUntill] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if(!blockedUntill) {
      return 
    }
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0,blockedUntill - now);

      if(remaining === 0){
        setBlockedUntill(null);
        setTimeLeft(0);
        toast.success("Rate limit reset! You can try again now.",{position: "top-center"});
        clearInterval(interval);
      }else {
        setTimeLeft(remaining);
      }
    },1000);
    return () => clearInterval(interval);
  },[blockedUntill])

  const formatTimeLeft = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Validation
    if (!username.trim()) {
      setError("Username is required");
      setLoading(false);
      return;
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      setLoading(false);
      return;
    }

    if (!password) {
      setError("Password is required");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters !.",{position: "top-center"});
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Password do not match !.",{position: "top-center"});
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:3000/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        }
      );
      if (response.status === 429){
        const blockedTime = Date.now() + (15 * 60 * 1000); // 15 mins from now 
        setBlockedUntill(blockedTime);
        toast.error(
          `⏳ Too many registration attempts! Try again in: ${formatTimeLeft(15 * 60 * 1000)}`,
          {
            position: "top-center",
            autoClose: false,
            closeButton: true
          }
        );
        setError("Too many registration attempts. Please try again later.");
        setLoading(false);
        return;  // ✅ EXIT EARLY - Don't parse JSON!
      }
      const data = await response.json();

      if (response.ok) {
        setSuccess("Registration successful! Redirecting to login...");
        toast.success("Registration successfull !.",{position: "top-center"});
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        toast.error("Registration failed !.",{position:"top-center"});
        setError(data.message || "Registration failed. Try another username.");
      }
    } catch (err) {
      toast.error("Connection error !.",{position: "top-center"});
      setError("Connection error. Please check your network.");
      console.error("Register error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">💬</div>
          <h1>Join ConvoSync</h1>
          <p>Create your account</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* ✅ NEW: Show countdown timer if blocked */}
        {blockedUntill && (
          <div className="blocked-message">
            ⏳ Blocked for: {formatTimeLeft(timeLeft)}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading || blockedUntill}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Create a password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || blockedUntill}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading || blockedUntill}
            />
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={loading || blockedUntill}
          >
            {loading ? "Creating account..." : blockedUntill ? `Try again in ${formatTimeLeft(timeLeft)}` : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <a href="/login">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;