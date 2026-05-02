const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/search", authMiddleware, async (req, res) => {
  try {
    const query = req.query.query;

    if (!query) {
      return res.json([]);
    }

    const users = await User.find({
      username: {
        $regex: query,
        $options: "i"
      },
      _id: {
        $ne: req.user.userId
      }
    }).select("username");

    res.status(200).json(users);

  } catch (error) {
    res.status(500).json({
      message: "Search failed"
    });
  }
});

module.exports = router;