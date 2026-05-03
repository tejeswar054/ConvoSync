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

module.exports = mongoose.model("Message", messageSchema);