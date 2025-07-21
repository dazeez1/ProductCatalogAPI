// Authentication middleware for JWT token validation and role-based access control
require("dotenv").config();
const jwt = require("jsonwebtoken");

// Get JWT secret key from environment variables
const SECRET_KEY = process.env.SECRET_KEY;

// Middleware to authenticate JWT tokens from request headers
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check if Authorization header exists and starts with "Bearer "
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify and decode the JWT token
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

// Middleware factory for role-based authorization
const authorize = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res
        .status(403)
        .json({ error: "You do not have permission to access this resource" });
    }
    next();
  };
};

// Export middleware functions
module.exports = { authenticate, authorize };
