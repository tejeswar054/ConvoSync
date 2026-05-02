require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/userRoutes");
const cors = require("cors");

const connectDB = require("./config/db");
const chatSocket = require("./socket/chat");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();
const server = http.createServer(app);

// Configure middleware
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.get("/api/protected", authMiddleware, (req, res) => {
  res.status(200).json({
    message: "Protected route accessed",
    user: req.user
  });
});

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// Connect DB and start server
(async () => {
  await connectDB();

  // Attach socket handlers
  chatSocket(io);

  // Start server
  server.listen(3000, () => {
    console.log("Server running on port 3000");
  });
})();


