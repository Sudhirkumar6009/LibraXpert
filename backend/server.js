const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const apiRoutes = require("./routes/login_route");
const registrationRoute = require("./routes/registration_route");
const booksRoute = require("./routes/books_route");

const app = express();

// Add CORS configuration before other middleware
app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:8080",
    "http://localhost:5173",
    "http://localhost:3000",
  ];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

app.use(express.json());

// MongoDB Connection with updated options
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    family: 4,
  })
  .then(async () => {
    console.log("Connected to MongoDB - Database: LibraXpert");

    // One-time fix for index conflicts - remove after first run
    try {
      const User = require("./models/users");
      const Book = require("./models/books");

      // Drop existing indexes to avoid conflicts
      await User.collection.dropIndexes();
      await Book.collection.dropIndexes();

      console.log("Existing indexes dropped successfully");

      // Recreate indexes from schema
      await User.createIndexes();
      await Book.createIndexes();

      console.log("New indexes created successfully");
    } catch (error) {
      console.log("Index operation completed (some operations may have been skipped)");
    }
  })
  .catch((err) => {
    console.error("MongoDB connection Error:", err);
    process.exit(1);
  });

// Routes
app.use("/api/auth", registrationRoute);
app.use("/api", apiRoutes);
app.use("/api", booksRoute);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
