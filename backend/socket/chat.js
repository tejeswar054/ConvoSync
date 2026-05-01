const Message = require("../models/Message");
const jwt = require("jsonwebtoken")

// userId → socketIds mapping
let userSocketMap = {};
let onlineUsers = {};
let lastSeen = {};

const chatSocket = (io) => {
  io.on("connection", async (socket) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        socket.disconnect();
        return;
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        socket.user = decoded;

    } catch (error) {
        socket.disconnect();
        return;
    }

    const userId = socket.user.username;

    // =============================
    // 1️⃣ ADD USER SOCKET
    // =============================
    if (!userSocketMap[userId]) {
      userSocketMap[userId] = [];
    }

    userSocketMap[userId].push(socket.id);

    console.log("New user connected:", userId, socket.id);

    onlineUsers[userId] = true;
    io.emit("user_status", {
      userId,
      status: "online"
    });

    // send all online users to this new user
    socket.emit("all_users_status", {
      onlineUsers,
      lastSeen
    });

    // =============================
    // GET USERS
    // =============================
    socket.on("get_users", async () => {
      const messages = await Message.find({
        $or: [
          { from: userId },
          { to: userId }
        ]
      });

      const users = new Set();

      messages.forEach(msg => {
        if (msg.from !== userId) users.add(msg.from);
        if (msg.to !== userId) users.add(msg.to);
      });

      // Calculate unread counts from DB
      const unreadCounts = {};

      for (const user of users) {
        unreadCounts[user] = await Message.countDocuments({
          from: user,
          to: userId,
          status: { $in: ["sent", "delivered"] }
        });
      }

      socket.emit("user_list", {
        users: Array.from(users),
        unreadCounts
      });
    });

    // =============================
    // LOAD MESSAGES
    // =============================
    socket.on("load_messages", async ({ to }) => {
      const from = userId;

      const messages = await Message.find({
        $or: [
          { from, to },
          { from: to, to: from }
        ]
      })
      .sort({ time: 1 })
      .limit(20);

      messages.reverse().forEach(msg => {
        socket.emit("receive_message", {
          from: msg.from,
          to: msg.to,
          message: msg.message,
          status: msg.status
        });
      });

      await Message.updateMany(
        { to: from, status: "sent" },
        { status: "delivered" }
      );
    });

    // =============================
    // GET USERS STATUS
    // =============================
    socket.on("get_users_status", () => {
      socket.emit("all_users_status", {
        onlineUsers,
        lastSeen
      });
    });

    // =============================
    // SEND MESSAGE
    // =============================
    socket.on("send_message", async ({ to, message }) => {
      const from = socket.user.username;

      if (!from) {
        console.log("Invalid user, message ignored");
        return;
      }

      // save message in DB
      const newMessage = await Message.create({
        from,
        to,
        message,
        status: "sent"
      });

      const receiverSockets = userSocketMap[to];

      // if receiver is online
      if (receiverSockets) {
        receiverSockets.forEach(id => {
          io.to(id).emit("receive_message", {
            from,
            to,
            message
          });
        });

        // update status to delivered
        await Message.updateOne(
          { _id: newMessage._id },
          { status: "delivered" }
        );
      }

      const senderSockets = userSocketMap[from];
      if (senderSockets) {
        senderSockets.forEach(id => {
          io.to(id).emit("receive_message", {
            from,
            to,
            message
          });
        });
      }
    });

    // =============================
    // MESSAGE READ
    // =============================
    socket.on("message_read", async ({ from }) => {
      const to = userId;

      await Message.updateMany(
        { from, to, status: "delivered" },
        { status: "read" }
      );

      const senderSockets = userSocketMap[from];

      if (senderSockets) {
        senderSockets.forEach(id => {
          io.to(id).emit("message_read_ack", {
            to
          });
        });
      }
    });

    // =============================
    // TYPING INDICATORS
    // =============================
    socket.on("typing", ({ to }) => {
      const from = userId;
      const receiverSockets = userSocketMap[to];

      if (receiverSockets) {
        receiverSockets.forEach(id => {
          io.to(id).emit("typing", { from });
        });
      }
    });

    socket.on("stop_typing", ({ to }) => {
      const from = userId;
      const receiverSockets = userSocketMap[to];

      if (receiverSockets) {
        receiverSockets.forEach(id => {
          io.to(id).emit("stop_typing", { from });
        });
      }
    });

    // =============================
    // DISCONNECT HANDLING
    // =============================
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);

      userSocketMap[userId] = userSocketMap[userId].filter(
        id => id !== socket.id
      );

      if (userSocketMap[userId].length === 0) {
        delete userSocketMap[userId];
        delete onlineUsers[userId];
        lastSeen[userId] = new Date();

        io.emit("user_status", {
          userId,
          status: "offline",
          lastSeen: lastSeen[userId]
        });
      }

      console.log("Updated Map:", userSocketMap);
    });
  });
};

module.exports = chatSocket;
