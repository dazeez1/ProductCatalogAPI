require("dotenv").config();

// Import core dependencies
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// Import route modules for better code organization
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const productsRoutes = require("./routes/productsRoutes");
const categoriesRoutes = require("./routes/categoriesRoutes");

// Initialize Express application
const app = express();

// Swagger API documentation configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Product Catalog API",
      version: "1.0.0",
      description:
        "A comprehensive RESTful API for managing product catalogs with authentication, inventory tracking, and reporting features.",
      contact: {
        name: "API Support",
        email: "support@productcatalog.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    // Define JWT authentication scheme for Swagger docs
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  // Specify where to find API documentation comments
  apis: ["./routes/*.js", "./models/*.js"],
};

// Generate Swagger specification
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Configure middleware
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// Serve interactive API documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Root route
app.get("/", (req, res) => {
  res.send(
    "Exploring the Product Catalog API! Visit /api-docs for documentation."
  );
});

// API routes
app.use("/products", productsRoutes);
app.use("/categories", categoriesRoutes);
app.use("/auth", authRoutes);
app.use("/users", userRoutes);

// Database connection string with fallback options
const mongoURI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://localhost:27017/ProductCatalogAPI";

// Connect to MongoDB with error handling
mongoose
  .connect(mongoURI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));

// server
if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Export
module.exports = app;
