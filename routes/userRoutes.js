// User routes for user management operations
const express = require("express");
const User = require("../models/user");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

const router = express.Router();

// Get all users
router.get("/", authenticate, authorize("admin"), async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export router
module.exports = router;
