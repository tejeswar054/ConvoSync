import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const { token } = useContext(AuthContext);

  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" />;
  }

  // Token exists, show the page
  return children;
}

export default ProtectedRoute;