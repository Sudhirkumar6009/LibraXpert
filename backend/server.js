const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const apiRoutes = require("./routes/login_route");
const registrationRoute = require("./routes/registration_route");
const booksRoute = require("./routes/books_route");
const borrowRoute = require("./routes/borrow_requests_route");
const loansRoute = require("./routes/loans_route");
const notificationsRoute = require("./routes/notifications_route");
const reservationsRoute = require("./routes/reservations_route");

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
// Static serving for uploaded book files
const path = require("path");
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
// Serve covers stored outside the repo under data/covers
const coversPath = path.join(process.cwd(), "data", "covers");
const fs = require("fs");
fs.mkdirSync(coversPath, { recursive: true });
app.use("/covers", express.static(coversPath));

// MongoDB Connection with updated options
const mongoUri = process.env.MONGO_URI;
const mongoDbName = process.env.MONGO_DB || "LibraXpert";

mongoose
  .connect(mongoUri, {
    dbName: mongoDbName, // explicit DB selection
  })
  .then(() => {
    console.log("MongoDB connected to database:", mongoDbName);
    // Check Firebase Storage connectivity (non-blocking)
    try {
      if (typeof booksRoute.initFirebaseCheck === "function") {
        booksRoute.initFirebaseCheck().then(() => {}).catch(() => {});
      }
    } catch (e) {
      console.warn("Firebase check failed to start:", e && e.message ? e.message : e);
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
app.use("/api", loansRoute);
app.use("/api/borrow-requests", borrowRoute);
app.use("/api/notifications", notificationsRoute);
app.use("/api/reservations", reservationsRoute);

// Error handling middleware
// Error handling middleware (better JSON responses for clients and clearer logs)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err && err.message ? err.message : err);
  // Multer file size or file type errors
  if (err && err.name === "MulterError") {
    return res.status(400).json({ message: err.message });
  }
  // Validation or client errors
  if (err && err.status && err.message) {
    return res.status(err.status).json({ message: err.message });
  }
  // Default to 500
  const payload = { error: "Internal Server Error", message: err.message };
  if (process.env.NODE_ENV !== "production") payload.stack = err.stack;
  res.status(500).json(payload);
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
