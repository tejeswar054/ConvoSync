require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const chatSocket = require("./socket/chat");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();
const server = http.createServer(app);

// Trust proxy (required for rate limiting on Render)
app.set('trust proxy', 1);

// general api rateLimiter 
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests per 15 min
  message: "Too many requests , please try again later"

});
// Strict limiter for auth (login/register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many login attempts , please try again later"
});

// Configure middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173", // Only frontend can access
  credentials: true,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
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
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Only frontend
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// Connect DB and start server
(async () => {
  await connectDB();

  // Attach socket handlers
  chatSocket(io);

  // Start server
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();


