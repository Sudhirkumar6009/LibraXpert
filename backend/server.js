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
const feedbackRoute = require("./routes/feedback_route");

const app = express();

// CORS configuration - must be before all routes
const allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:3000",
  "https://libra-xpert.vercel.app",
  "https://libraxpert.onrender.com"
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check exact match or Vercel preview URLs
    if (allowedOrigins.includes(origin) || origin.match(/^https:\/\/libra-xpert.*\.vercel\.app$/)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Health check / root route
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "LibraXpert API is running" });
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
app.use("/api", feedbackRoute);

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
