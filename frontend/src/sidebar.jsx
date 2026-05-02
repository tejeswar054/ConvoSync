import { useEffect, useState } from "react";
import "./sidebar.css";

function Sidebar({
  socket,
  setSelectedUser,
  selectedUser,
  unreadCounts,
  setUnreadCounts,
  chatList,
  setChatList,
  search,
  searchResults,
  handleSearch,
  startNewChat
}) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!socket) return;

    // Load initial users
    socket.emit("get_users");

    // Receive users and unread counts
    socket.on("user_list", ({ users, unreadCounts }) => {
      setUsers(users);
      setChatList(users); // Sync with chatList
      setUnreadCounts(unreadCounts);
    });

    return () => socket.off("user_list");
  }, [socket, setChatList]);

  // Display list depends on search
  const displayList = search.trim() ? searchResults : users;

  return (
    <div className="sidebar">
      <h3>💬 Chats</h3>

      {/* SEARCH INPUT */}
      <div className="sidebar-search">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {/* SEARCH RESULTS */}
      {search.trim() && (
        <div className="search-results">
          {searchResults.length === 0 ? (
            <div className="no-results">No users found</div>
          ) : (
            searchResults.map((user) => (
              <div
                key={user._id}
                className="search-result-item"
                onClick={() => startNewChat(user.username)}
              >
                <div className="search-result-name">{user.username}</div>
                <div className="search-result-add">+ Add</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* CHAT LIST */}
      <div className="sidebar-users">
        {chatList.length === 0 ? (
          <div style={{ color: "var(--text)", fontSize: "14px", padding: "15px" }}>
            No chats yet. Search to start!
          </div>
        ) : (
          chatList.map((user) => (
            <div
              key={user}
              className={`user-item ${selectedUser === user ? "active" : ""}`}
              onClick={() => setSelectedUser(user)}
              title={user}
            >
              <div className="user-item-name">{user}</div>
              {unreadCounts[user] > 0 && (
                <div className="user-item-badge">{unreadCounts[user]}</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Sidebar;
