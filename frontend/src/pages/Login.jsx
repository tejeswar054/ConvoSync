import { toast } from 'react-toastify';
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from "../context/AuthContext";
import "./AuthPages.css";
function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState(null);  // ✅ NEW
  const [timeLeft, setTimeLeft] = useState(0);             // ✅ NEW
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  // ✅ NEW: Timer countdown effect
  useEffect(() => {
    if (!blockedUntil) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, blockedUntil - now);
      
      if (remaining === 0) {
        setBlockedUntil(null);
        setTimeLeft(0);
        toast.success("Rate limit reset! You can try again now.", {
          position: "top-center"
        });
        clearInterval(interval);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [blockedUntil]);

  // ✅ Helper: Format milliseconds to minutes:seconds
  const formatTimeLeft = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!username.trim()) {
      setError("Username is required");
      setLoading(false);
      return;
    }

    if (!password) {
      setError("Password is required");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:3000/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        }
      );

      // ✅ CHECK STATUS FIRST (before parsing JSON)
      if (response.status === 429) {
        const blockedTime = Date.now() + (15 * 60 * 1000); // 15 minutes from now
        setBlockedUntil(blockedTime);
        
        toast.error(
          `⏳ Too many login attempts! Try again in: ${formatTimeLeft(15 * 60 * 1000)}`,
          {
            position: "top-center",
            autoClose: false,
            closeButton: true
          }
        );
        setError("Too many login attempts. Please try again later.");
        setLoading(false);
        return;  // ✅ EXIT EARLY - Don't parse JSON!
      }

      // ✅ NOW parse JSON (safe for 200, 400, etc.)
      const data = await response.json();

      if (response.ok) {
        login(username, data.token);
        toast.success("Login successful!", { position: "top-center" });
        navigate("/chat");
      } else {
        setError(data.message || "Login failed. Please try again.");
        toast.error(data.message || "Login failed", { position: "top-center" });
      }
    } catch (err) {
      setError("Connection error. Please check your network.");
      toast.error("Connection error", { position: "top-center" });
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">💬</div>
          <h1>ConvoSync</h1>
          <p>Sign in to your account</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* ✅ NEW: Show countdown timer if blocked */}
        {blockedUntil && (
          <div className="blocked-message">
            ⏳ Blocked for: {formatTimeLeft(timeLeft)}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading || blockedUntil}  // ✅ Disable when blocked
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || blockedUntil}  // ✅ Disable when blocked
            />
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={loading || blockedUntil}  // ✅ Disable when blocked
          >
            {loading ? "Signing in..." : blockedUntil ? `Try again in ${formatTimeLeft(timeLeft)}` : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{" "}
            <a href="/register">Create one</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;