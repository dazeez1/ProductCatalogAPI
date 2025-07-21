// Category Model
const mongoose = require("mongoose");

// Category schema with unique names and optional descriptions
const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
});

// Export the Category model
module.exports = mongoose.model("Categories", CategorySchema);
