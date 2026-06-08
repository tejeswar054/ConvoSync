import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chatpage from "./pages/Chatpage";

function App() {
  const { token, loading } = useContext(AuthContext);

  // ✅ Wait for auth context to load
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
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* ✅ If logged in, ANY route goes to chat */}
      {token ? (
        <>
          <Route path="/chat" element={<Chatpage />} />
          <Route path="/" element={<Navigate to="/chat" />} />
          <Route path="/login" element={<Navigate to="/chat" />} />
          <Route path="/register" element={<Navigate to="/chat" />} />
          <Route path="*" element={<Navigate to="/chat" />} />
        </>
      ) : (
        /* ✅ If not logged in, show auth pages only */
        <>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/chat" element={<Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </>
      )}
    </Routes>
  );
}

export default App;

