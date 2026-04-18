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
            message: msg.message
        });
    });

    // mark them as delivered
    await Message.updateMany(
        { to: userId, status: "sent" },
        { status: "delivered" }
    );

    const conversationMessages = await Message.find({
        $or : [
            {to : userId},
            {from : userId}
        ]
    })
    .sort({time : -1})
    .limit(5);
    conversationMessages.reverse().forEach(msg => {
        socket.emit("receive_message",{
            from : msg.from,
            message : msg.message
        });
    });
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
                    message
                });
            });

            // update status to delivered
            await Message.updateOne(
                { _id: newMessage._id },
                { status: "delivered" }
            );
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
        }

        console.log("Updated Map:", userSocketMap);
    });
});

// start server
server.listen(3000, () => {
    console.log("Server running on port 3000");
});