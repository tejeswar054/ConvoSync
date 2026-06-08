const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  from: String,
  to: String,
  message: String,
  status: {
    type: String,
    enum: ["sent", "delivered", "read"],
    default: "sent"
  },
  time: {
    type: Date,
    default: Date.now
  },
  file: new mongoose.Schema({
    url: String,
    name: String,
    size: Number,
    type: String
  }, { _id: false })
});

// 📍 Add indexes for fast queries
// ✅ Compound index: Find messages between two specific users (most important)
messageSchema.index({ from: 1, to: 1 });

// ✅ Single index: Find all messages FROM a user (for user's sent messages)
messageSchema.index({ from: 1 });

// ✅ Single index: Find all messages TO a user (for user's received messages)
messageSchema.index({ to: 1 });

// ✅ Compound index: Find unread messages between specific users (for unread count)
messageSchema.index({ from: 1, to: 1, status: 1 });

module.exports = mongoose.model("Message", messageSchema);