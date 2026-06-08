import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

// ✅ Helper function to check if token is expired
const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    // Parse JWT manually (without server verification)
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    const payload = JSON.parse(atob(parts[1]));
    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    
    return currentTime > expiryTime; // True if expired
  } catch (error) {
    return true; // If error parsing, assume expired
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);  // ✅ Add loading state

  // Run once on app load
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("username");
    
    if (savedToken) {
      // ✅ Check if token is expired
      if (isTokenExpired(savedToken)) {
        console.log("⏰ Token expired, clearing...");
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        setToken(null);
        setUser(null);
      } else {
        console.log("✅ Token valid, restoring user...");
        setToken(savedToken);
        setUser(savedUser);
      }
    }
    
    setLoading(false);  // ✅ Mark loading as complete
  }, []);

  // Login function
  const login = (username, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("username", username);
    setToken(token);
    setUser(username);
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
