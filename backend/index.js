require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const authRoutes = require("./routes/auth");

const connectDB = require("./config/db");
const chatSocket = require("./socket/chat");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();
const server = http.createServer(app);

// Serve static files from client folder
app.use(express.json());
app.use(express.static(path.join(__dirname, "../client")));
app.use("/api/auth",authRoutes);

app.get("/api/protected",authMiddleware,(req,res) => {
  res.status(200).json({
    message:"Protected route accessed",
    user : req.user
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

  // Route
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/index.html"));
  });

  // Start server
  server.listen(3000, () => {
    console.log("Server running on port 3000");
  });
})();


