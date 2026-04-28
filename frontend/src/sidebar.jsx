import { useEffect, useState } from "react";

function Sidebar({ socket, setSelectedUser, selectedUser, unreadCounts, setUnreadCounts }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!socket) return;

    // ask backend
    socket.emit("get_users");

    // receive users and unread counts
    socket.on("user_list", ({ users, unreadCounts }) => {
      setUsers(users);
      setUnreadCounts(unreadCounts);
    });

    return () => socket.off("user_list");
  }, [socket]);

  return (
    <div style={styles.sidebar}>
      <h3>Chats</h3>

      {users.map((user) => (
        <div
          key={user}
          style={{
            ...styles.user,
            backgroundColor: selectedUser === user ? "#007bff" : "#f1f1f1",
            color: selectedUser === user ? "white" : "black",
          }}
          onClick={() => setSelectedUser(user)}
        >
          {user} {unreadCounts[user] ? `(${unreadCounts[user]})` : ""}
        </div>
      ))}
    </div>
  );
}

const styles = {
  sidebar: {
    width: "200px",
    borderRight: "1px solid #ddd",
    padding: "10px",
  },
  user: {
    padding: "10px",
    marginBottom: "5px",
    cursor: "pointer",
    borderRadius: "5px",
  },
};

export default Sidebar;
