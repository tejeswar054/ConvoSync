import { useEffect, useState, useRef } from "react";
import { CldUploadWidget } from "next-cloudinary";
import "./ChatWindow.css";
const CLOUDINARY_CLOUD_NAME = "dzn51fdrx"; // cloud dashboard name 

function ChatWindow({ socket, userId, selectedUser, unreadCounts, setUnreadCounts, chatList, setChatList }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [status, setStatus] = useState("Offline 🔴");
  const [typing, setTyping] = useState("");
  const messagesEndRef = useRef(null);
  const chatListRef = useRef(chatList);  // ✅ Keep track of latest chatList

  // ✅ Update ref whenever chatList changes
  useEffect(() => {
    chatListRef.current = chatList;
  }, [chatList]);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket || !selectedUser) return;

    setMessages([]);

    // listen for messages
    socket.on("receive_message", (msg) => {
      // ✅ Use ref to get LATEST chatList (not stale closure value)
      // ✅ IMPORTANT: Don't add current user to their own chatList
      if (msg.from !== userId && !chatListRef.current.includes(msg.from)) {
        setChatList((prev) => [...prev, msg.from]);
      }

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

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!selectedUser) {
    return (
      <div className="chatwindow-container">
        <div className="empty-chat">
          <div style={{ fontSize: "48px", marginBottom: "10px" }}>💬</div>
          <h2 style={{ margin: "0 0 8px 0" }}>No chat selected</h2>
          <p style={{ margin: 0, color: "var(--text)" }}>
            Select a conversation to start messaging
          </p>
        </div>
      </div>
    );
  }

  const handleUploadSuccess = (result) => {
    // extract url form cloudinary response
    const imageUrl = result.info.secure_url;
    const fileName = result.info.original_filename || "image";
    const fileSize = result.info.bytes || 0 ;

    // send via socket.io with file info
    socket.emit("send_message",{
      to : selectedUser,
      message: newMessage,
      fileUrl : imageUrl,
      fileName : fileName,
      fileSize : fileSize,
      fileType : "image"
    });
    setNewMessage("")
  };

  return (
    <div className="chatwindow-container">
      <div className="chatwindow-header">
        <div className="chatwindow-title">
          {selectedUser}
        </div>
        <div className="chatwindow-status">
          {status}
        </div>
        <div className="chatwindow-typing">
          {typing}
        </div>
      </div>

      <div className="messages-container">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.from === userId ? "sent" : "received"}`}
          >
            <div className="message-content">
              {msg.message}
            </div>
            {/* ✅ Display file if exists */}
            {msg.file && (
              <div className="message-file">
                {msg.file.type === "image" ? (
                  <img 
                    src={msg.file.url} 
                    alt={msg.file.name}
                    className="file-image"
                  />
                ) : (
                  <a 
                    href={msg.file.url} 
                    download={msg.file.name}
                    className="file-link"
                  >
                    📎 {msg.file.name}
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <CldUploadWidget 
          cloudName = {CLOUDINARY_CLOUD_NAME}
          uploadPreset="convosync_upload"
          onSuccess={handleUploadSuccess}
        >
          {({open}) => (
            <button
              type="button"
              className="upload-btn"
              onClick={() => open()}
            >
              📎
            </button>
          )}
        </CldUploadWidget>
        <input
          className="message-input"
          type="text"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);

            socket.emit("typing", { to: selectedUser });

            clearTimeout(window.typingTimeout);

            window.typingTimeout = setTimeout(() => {
              socket.emit("stop_typing", { to: selectedUser });
            }, 1000);
          }}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
        />

        <button
          className="send-button"
          onClick={sendMessage}
          disabled={!newMessage.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatWindow;
