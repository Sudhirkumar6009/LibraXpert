const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    maxlength: [100, "Name cannot exceed 100 characters"]
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email"]
  },
  subject: {
    type: String,
    required: [true, "Subject is required"],
    enum: [
      "book-collection",
      "library-services", 
      "digital-resources",
      "staff-assistance",
      "facility-issues",
      "system-technical",
      "suggestions",
      "other"
    ]
  },
  message: {
    type: String,
    required: [true, "Message is required"],
    trim: true,
    maxlength: [2000, "Message cannot exceed 2000 characters"]
  },
  rating: {
    type: Number,
    required: [true, "Rating is required"],
    min: [1, "Rating must be at least 1"],
    max: [5, "Rating cannot exceed 5"]
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false // Allow anonymous feedback
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [1000, "Admin notes cannot exceed 1000 characters"]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
feedbackSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ subject: 1 });

module.exports = mongoose.model("Feedback", feedbackSchema);