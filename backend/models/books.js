const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  author: { type: String, required: true, trim: true, maxlength: 200 },
  isbn: {
    type: String,
    unique: true,
    sparse: true, // Only enforces uniqueness when a value exists
    trim: true,
    set: v => (v === '' ? undefined : v), // Treat empty string as undefined (not stored)
    validate: {
      validator: function(v) {
        if (!v) return true; // optional
        const cleaned = v.replace(/[-\s]/g, '');
        // Allow 10 or 13 digit (with optional starting 978/979) ISBNs; skip strict checksum to be permissive
        return /^(?:\d{9}[\dX]|97[89]\d{10})$/.test(cleaned);
      },
      message: 'Invalid ISBN format (expected 10 or 13 digits)'
    }
  },
  categories: [{ type: String, trim: true }],
  description: { type: String, maxlength: 2000 },
  publicationYear: { type: Number, min: 0 },
  publisher: { type: String, trim: true, maxlength: 120 },
  totalCopies: { type: Number, default: 1, min: 0 },
  availableCopies: { type: Number, default: 1, min: 0 },
  location: { type: String, trim: true },
  status: {
    type: String,
    enum: ["available", "reserved", "borrowed", "unavailable"],
    default: "available",
  },
  rating: { type: Number, min: 0, max: 5 },
  coverImage: { type: String, trim: true }, // URL or path
  pdfFile: { type: String, trim: true }, // stored filename/path
  tags: [{ type: String, trim: true }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

// Add only necessary custom indexes
bookSchema.index({ title: "text", author: "text", description: "text" });
bookSchema.index({ status: 1 });
bookSchema.index({ availableCopies: 1 });

// Update the updatedAt field before saving
bookSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Book", bookSchema);
