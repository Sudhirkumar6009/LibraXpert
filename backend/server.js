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

// MongoDB Connection with better error handling and options
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    family: 4, // Use IPv4, skip trying IPv6
  })
  .then(() => {
    console.log("Connected to MongoDB - Database: LibraXpert");
    // Create indexes for better performance
    const User = require("./models/users");
    const Book = require("./models/books");
    return Promise.all([User.createIndexes(), Book.createIndexes()]);
  })
  .then(() => {
    console.log("Database indexes created successfully");
  })
  .catch((err) => {
    console.error("MongoDB connection Error:", err);
    process.exit(1); // Exit the process if database connection fails
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
