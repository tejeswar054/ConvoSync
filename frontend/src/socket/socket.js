import { io } from "socket.io-client";
import { toast } from "react-toastify";

export const createSocket = (userId, token) => {
  const socket = io("http://localhost:3000", {
    auth: { 
      userId,
      token
    },
    reconnection: true,
    reconnectionDelay: 1000,           // Start with 1 second
    reconnectionDelayMax: 5000,        // Max 5 seconds between attempts
    reconnectionAttempts: 5,           // Try 5 times before giving up
    timeout: 20000                     // 20 second connection timeout
  });

  // ✅ Connection successful
  socket.on("connect", () => {
    console.log("✅ Connected to server:", socket.id);
    toast.success("Connected to server", { 
      position: "bottom-right",
      autoClose: 2000 
    });
  });

  // ✅ Connection error
  socket.on("connect_error", (error) => {
    console.error("❌ Connection error:", error.message);
    toast.error("Connection failed: " + error.message, { 
      position: "bottom-right" 
    });
  });

  // ✅ Disconnection
  socket.on("disconnect", (reason) => {
    console.warn("⚠️ Disconnected from server:", reason);
    if (reason === "io server disconnect") {
      // Server disconnected - try to reconnect
      socket.connect();
    }
  });

  // ✅ Reconnection attempt
  socket.on("reconnect_attempt", () => {
    console.log("🔄 Attempting to reconnect...");
    toast.info("Reconnecting...", { 
      position: "bottom-right",
      autoClose: 1000 
    });
  });

  // ✅ Reconnection failed
  socket.on("reconnect_failed", () => {
    console.error("❌ Failed to reconnect after multiple attempts");
    toast.error("Failed to reconnect. Please refresh the page.", { 
      position: "bottom-right",
      autoClose: false,
      closeButton: true
    });
  });

  // ✅ Authentication error
  socket.on("connect_error", (error) => {
    if (error.message === "Unauthorized" || error.message === "Invalid token") {
      console.error("❌ Authentication failed");
      toast.error("Authentication failed. Please login again.", { 
        position: "bottom-right" 
      });
      // Could redirect to login here if needed
      // window.location.href = "/login";
    }
  });

  return socket;
};