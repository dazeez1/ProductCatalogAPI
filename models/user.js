// User Model - handles user authentication and authorization
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// User schema with authentication fields and role-based access
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "customer"], default: "customer" },
});

// Pre-save middleware to hash passwords before saving
UserSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

// Method to compare password with hashed password for login
UserSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

// Export the User model
module.exports = mongoose.model("User", UserSchema);
