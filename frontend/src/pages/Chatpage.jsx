import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { createSocket } from "../socket/socket";
import Sidebar from "../sidebar";
import ChatWindow from "../components/ChatWindow";

function Chatpage() {
  const { user, token, logout } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    // Create socket with token (not userId prompt)
    const newSocket = createSocket(user, token);
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [user, token]);

  const handleLogout = () => {
    logout();
    socket?.disconnect();
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar
        socket={socket}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        unreadCounts={unreadCounts}
        setUnreadCounts={setUnreadCounts}
      />

      <ChatWindow
        socket={socket}
        userId={user}
        selectedUser={selectedUser}
        unreadCounts={unreadCounts}
        setUnreadCounts={setUnreadCounts}
      />

      <button onClick={handleLogout} style={{ position: "absolute", top: 10, right: 10 }}>
        Logout
      </button>
    </div>
  );
}

export default Chatpage;
