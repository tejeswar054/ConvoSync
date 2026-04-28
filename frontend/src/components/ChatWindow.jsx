import { useEffect, useState } from "react";

function ChatWindow({ socket, userId, selectedUser, unreadCounts, setUnreadCounts }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [status, setStatus] = useState("Offline 🔴");
  const [typing, setTyping] = useState("");

  useEffect(() => {
    if (!socket || !selectedUser) return;

    // clear old messages
    setMessages([]);

    // listen for messages
    socket.on("receive_message", (msg) => {

      const isCurrentChat =
        (msg.from === userId && msg.to === selectedUser) ||
        (msg.from === selectedUser && msg.to === userId);

      if (isCurrentChat) {
        setMessages((prev) => [...prev, msg]);

        if (msg.from !== userId) {
          socket.emit("message_read", { from: msg.from });
        }
      } else {
        if (msg.from !== userId) {
          setUnreadCounts((prev) => ({
            ...prev,
            [msg.from]: (prev[msg.from] || 0) + 1,
          }));
        }
      }
    });

    // listen for live status
    socket.on("user_status", (data) => {
      if (data.userId !== selectedUser) return;

      if (data.status === "online") {
        setStatus("Online 🟢");
      } else {
        setStatus(
          "Last seen: " +
          new Date(data.lastSeen).toLocaleTimeString()
        );
      }
    });

    // get all users status
    socket.on("all_users_status", (data) => {
      if (data.onlineUsers[selectedUser]) {
        setStatus("Online 🟢");
      } else if (data.lastSeen[selectedUser]) {
        setStatus(
          "Last seen: " +
          new Date(data.lastSeen[selectedUser]).toLocaleTimeString()
        );
      } else {
        setStatus("Offline 🔴");
      }
    });

    // listen for typing
    socket.on("typing", ({ from }) => {
      if (from === selectedUser) {
        setTyping(`${from} is typing...`);
      }
    });

    socket.on("stop_typing", ({ from }) => {
      if (from === selectedUser) {
        setTyping("");
      }
    });

    // Now emit after listeners are ready
    socket.emit("load_messages", { to: selectedUser });

    // reset unread count
    setUnreadCounts((prev) => ({
      ...prev,
      [selectedUser]: 0,
    }));

    // get current status
    socket.emit("get_users_status");

    return () => {
      socket.off("receive_message");
      socket.off("user_status");
      socket.off("all_users_status");
      socket.off("typing");
      socket.off("stop_typing");
    };
  }, [socket, selectedUser, userId]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    socket.emit("send_message", {
      to: selectedUser,
      message: newMessage,
    });

    setNewMessage("");
  };

  return (
    <div style={styles.container}>
      <h2>
        {selectedUser
          ? `Chat with ${selectedUser}`
          : "Select a user"}
      </h2>
      <p>{status}</p>
      <p style={{ color: "#aaa", fontStyle: "italic" }}>
        {typing}
      </p>

      <div style={styles.messages}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              ...styles.message,
              alignSelf:
                msg.from === userId ? "flex-end" : "flex-start",
              backgroundColor:
                msg.from === userId ? "#007bff" : "#e4e6eb",
              color:
                msg.from === userId ? "white" : "black",
            }}
          >
            {msg.message}
          </div>
        ))}
      </div>

      {selectedUser && (
        <div style={styles.inputArea}>
          <input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);

              socket.emit("typing", { to: selectedUser });

              clearTimeout(window.typingTimeout);

              window.typingTimeout = setTimeout(() => {
                socket.emit("stop_typing", { to: selectedUser });
              }, 1000);
            }}
            placeholder="Type message..."
            style={styles.input}
          />

          <button onClick={sendMessage} style={styles.button}>
            Send
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    padding: "20px",
  },
  messages: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    overflowY: "auto",
    paddingRight: "10px",
    marginBottom: "10px",
  },
  message: {
    padding: "10px",
    borderRadius: "8px",
    maxWidth: "60%",
  },
  inputArea: {
    display: "flex",
    gap: "10px",
  },
  input: {
    flex: 1,
    padding: "10px",
  },
  button: {
    padding: "10px 20px",
  },
  inputArea: {
    display: "flex",
    gap: "10px",
    paddingTop: "10px",
    borderTop: "1px solid #333",
  },
};

export default ChatWindow;
