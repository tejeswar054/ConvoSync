require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
const server = http.createServer(app);

// Serve static files from client folder
app.use(express.static(path.join(__dirname, "../client")));

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/index.html"));
});

// MongoDB connection
const mongoUri = process.env.MONGODB_URI;

mongoose.connect(mongoUri)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// Message Schema
const messageSchema = new mongoose.Schema({
    from: String,
    to: String,
    message: String,
    status: {
        type: String,
        enum: ["sent", "delivered", "read"],
        default: "sent"
    },
    time: { type: Date, default: Date.now }
});

const Message = mongoose.model("Message", messageSchema);

// userId → socketIds mapping
let userSocketMap = {};
let onlineUsers = {};
let lastSeen = {};

io.on("connection", async (socket) => {

    const userId = socket.handshake.auth.userId;

    // =============================
    // 1️⃣ ADD USER SOCKET
    // =============================
    if (!userSocketMap[userId]) {
        userSocketMap[userId] = [];
    }

    userSocketMap[userId].push(socket.id);

    console.log("New user connected:", userId, socket.id);

    socket.on("get_users", async() => {
        const userId = socket.handshake.auth.userId;
        const messages = await Message.find({
            $or: [
                {from : userId},
                {to : userId}
            ]
        });
        const users = new Set();
        messages.forEach(msg => {
            if(msg.from !== userId) users.add(msg.from);
            if (msg.to !== userId) users.add(msg.to);
        });
        socket.emit("user_list",Array.from(users));
    });
    

    onlineUsers[userId] = true;
    io.emit("user_status",{
        userId,
        status : "online"
    });

    // send all online users to this new user
    socket.emit("all_users_status", {
        onlineUsers,
        lastSeen
    });

    // =============================
    // 2️⃣ OFFLINE MESSAGES DELIVERY
    // =============================

    // fetch all undelivered messages
    const messages = await Message.find({
        to: userId,
        status: "sent"
    });

    // send them to user
    messages.forEach(msg => {
        socket.emit("receive_message", {
            from: msg.from,
            to: msg.to,
            message: msg.message
        });
    });

    // mark them as delivered
    await Message.updateMany(
        { to: userId, status: "sent" },
        { status: "delivered" }
    );

    // =============================
    // 3️⃣ SEND MESSAGE
    // =============================
    socket.on("send_message", async ({ to, message }) => {

        const from = socket.handshake.auth.userId;

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
        if (senderSockets){
            senderSockets.forEach(id => {
                io.to(id).emit("receive_message",{
                    from,
                    to,
                    message
                });
            });
        }
    });
    

    socket.on("message_read", async ({from}) => {
        const to = socket.handshake.auth.userId
        await Message.updateMany({
            from : from,
            to : to,
            status: "delivered"
        }, {
            status : "read"
        }
    );
    const senderSockets = userSocketMap[from];
    if (senderSockets){
        senderSockets.forEach(id => {
            io.to(id).emit("message_read_ack",{
                to
            });
        });
    }
    });

    socket.on("load_messages", async ({ to }) => {
        const from = socket.handshake.auth.userId;

        const messages = await Message.find({
            $or: [
                { from, to },
                { from: to, to: from }
            ]
        })
        .sort({ time: -1 })
        .limit(20);

        messages.reverse().forEach(msg => {
            socket.emit("receive_message", {
                from: msg.from,
                to: msg.to,
                message: msg.message
            });
        });

        await Message.updateMany(
            { to: from, status: "sent" },
            { status: "delivered" }
        );
    });

    socket.on("get_users_status", () => {
        socket.emit("all_users_status", {
            onlineUsers,
            lastSeen
        });
    });

    // =============================
    // 5️⃣ TYPING INDICATORS
    // =============================
    socket.on("typing", ({ to }) => {
        const from = socket.handshake.auth.userId;
        const receiverSockets = userSocketMap[to];

        if (receiverSockets) {
            receiverSockets.forEach(id => {
                io.to(id).emit("typing", { from });
            });
        }
    });

    socket.on("stop_typing", ({ to }) => {
        const from = socket.handshake.auth.userId;
        const receiverSockets = userSocketMap[to];

        if (receiverSockets) {
            receiverSockets.forEach(id => {
                io.to(id).emit("stop_typing", { from });
            });
        }
    });

    // =============================
    // 4️⃣ DISCONNECT HANDLING
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

            io.emit("user_status",{
            userId,
            status:"offline",
            lastSeen: lastSeen[userId]
            });
        }

        console.log("Updated Map:", userSocketMap);
        
    });
});

// start server
server.listen(3000, () => {
    console.log("Server running on port 3000");
});