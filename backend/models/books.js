const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    maxlength: [200, "Title cannot exceed 200 characters"],
  },
  author: {
    type: String,
    required: [true, "Author is required"],
    trim: true,
    maxlength: [100, "Author name cannot exceed 100 characters"],
  },
  isbn: {
    type: String,
    unique: true,
    sparse: true, // Allows null values but ensures uniqueness when present
    trim: true,
    match: [
      /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/,
      "Invalid ISBN format",
    ],
  },
  genre: {
    type: String,
    required: [true, "Genre is required"],
    trim: true,
  },
  description: {
    type: String,
    maxlength: [1000, "Description cannot exceed 1000 characters"],
  },
  publishedDate: {
    type: Date,
  },
  publisher: {
    type: String,
    trim: true,
    maxlength: [100, "Publisher name cannot exceed 100 characters"],
  },
  pageCount: {
    type: Number,
    min: [1, "Page count must be at least 1"],
  },
  language: {
    type: String,
    default: "English",
    trim: true,
  },
  coverImage: {
    type: String,
    trim: true,
  },
  availability: {
    type: Boolean,
    default: true,
  },
  location: {
    type: String,
    trim: true,
  },
  tags: [
    {
      type: String,
      trim: true,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Add only necessary custom indexes
bookSchema.index({ title: "text", author: "text", description: "text" }); // Text search
bookSchema.index({ genre: 1 }); // For filtering by genre
bookSchema.index({ availability: 1 }); // For filtering available books

// Update the updatedAt field before saving
bookSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Book", bookSchema);
