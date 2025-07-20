const express = require("express");
const User = require("../models/user");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", authenticate, authorize("admin"), async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
