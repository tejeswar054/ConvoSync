require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/userRoutes");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const chatSocket = require("./socket/chat");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();
const server = http.createServer(app);

// general api rateLimiter 
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests per 15 min
  message: "Too many requests , please try again later"

});
// Strict limiter for auth (login/register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts , please try again later"
});

// Configure middleware
app.use(cors());
app.use(express.json());

// apply rate limiters to all routes 
app.use("/api",generalLimiter);
app.use("/api/auth/register",authLimiter);
app.use("/api/auth/login",authLimiter);

// Mount routes after limiters
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


