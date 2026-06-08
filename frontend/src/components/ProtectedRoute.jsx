import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const { token, loading } = useContext(AuthContext);

  // ✅ Wait for AuthContext to load token from localStorage
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#1a1a1a'
      }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <h2>Loading...</h2>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If no token after loading is complete, redirect to login
  if (!token) {
    return <Navigate to="/login" />;
  }

  // Token exists, show the page
  return children;
}

export default ProtectedRoute;