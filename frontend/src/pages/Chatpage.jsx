import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { createSocket } from "../socket/socket";
import Sidebar from "../sidebar";
import ChatWindow from "../components/ChatWindow";
import "./Chatpage.css";

function Chatpage() {
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [chatList, setChatList] = useState([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    // Create socket with token (not userId prompt)
    const newSocket = createSocket(user, token);
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [user, token]);

  const handleSearch = async (value) => {
    setSearch(value);
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:3000/api/users/search?query=${value}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (response.ok) {
        setSearchResults(data);
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  // Start new chat with selected user
  const startNewChat = (username) => {
    if (!chatList.includes(username)) {
      setChatList((prev) => [...prev, username]);
    }
    setSelectedUser(username);
    setSearch("");
    setSearchResults([]);
  };

  const handleLogout = () => {
    logout();
    socket?.disconnect();
    navigate("/login");
  };

  // Get user initials for avatar
  const userInitials = user?.charAt(0).toUpperCase() || "U";

  return (
    <div className="chatpage-container">
      <div className="chatpage-header">
        <div className="user-info">
          <div className="user-avatar">{userInitials}</div>
          <div className="user-name">{user}</div>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>

      <div className="sidebar-wrapper">
        <Sidebar
          socket={socket}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          unreadCounts={unreadCounts}
          setUnreadCounts={setUnreadCounts}
          chatList={chatList}
          setChatList={setChatList}
          search={search}
          searchResults={searchResults}
          handleSearch={handleSearch}
          startNewChat={startNewChat}
        />
      </div>

      <div className="chat-wrapper">
        <ChatWindow
          socket={socket}
          userId={user}
          selectedUser={selectedUser}
          unreadCounts={unreadCounts}
          setUnreadCounts={setUnreadCounts}          chatList={chatList}
          setChatList={setChatList}        />
      </div>
    </div>
  );
}

export default Chatpage;
