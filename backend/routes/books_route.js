const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Book = require("../models/books");
const auth = require("../middleware/auth");

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads", "books");
fs.mkdirSync(uploadDir, { recursive: true });

// Multer storage config for PDF & optional cover image later
const storage = multer.diskStorage({
  destination: function (_req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || ".pdf";
    cb(null, unique + ext.toLowerCase());
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") return cb(null, true);
  // Allow common image types for cover images if desired
  if (/^image\//.test(file.mimetype)) return cb(null, true);
  cb(new Error("Only PDF or image files are allowed"));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } });

// List / search books
router.get("/books", async (req, res) => {
  try {
    const { q, status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (q) {
      filter.$text = { $search: q };
    }
    const books = await Book.find(filter).sort({ createdAt: -1 });
    res.json(books.map(normalizeBook));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper to normalize book document
function normalizeBook(b) {
  return {
    id: b._id,
    title: b.title,
    author: b.author,
    isbn: b.isbn,
    description: b.description,
    publicationYear: b.publicationYear,
    publisher: b.publisher,
    categories: b.categories,
    totalCopies: b.totalCopies,
    availableCopies: b.availableCopies,
    location: b.location,
    status: b.status,
    rating: b.rating,
    coverImage: b.coverImage,
    pdfFile: b.pdfFile,
    tags: b.tags,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

// Create book (librarian/admin only) with optional PDF & cover image upload
router.post(
  "/books",
  auth,
  upload.fields([
    { name: "file", maxCount: 1 }, // PDF
    { name: "cover", maxCount: 1 }, // Cover image / thumbnail
  ]),
  async (req, res) => {
    try {
      // Authorization: require role librarian/admin
      if (!["librarian", "admin"].includes(req.user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const {
        title,
        author,
        isbn,
        description,
        publicationYear,
        publisher,
        categories,
        totalCopies,
        location,
        tags,
    } = req.body;
    const files = req.files || {};
    const pdfFileUpload = Array.isArray(files.file) ? files.file[0] : null;
    const coverUpload = Array.isArray(files.cover) ? files.cover[0] : null;
  console.log("Create book payload", { body: req.body, pdf: !!pdfFileUpload, cover: !!coverUpload });

      const book = new Book({
        title,
        author,
        isbn,
        description,
        publicationYear,
        publisher,
        categories: Array.isArray(categories)
          ? categories
          : typeof categories === "string"
          ? categories.split(",").map((c) => c.trim()).filter(Boolean)
          : [],
        totalCopies: Number(totalCopies) || 1,
        availableCopies: Number(totalCopies) || 1,
        location,
        tags: Array.isArray(tags)
          ? tags
          : typeof tags === "string"
          ? tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
  pdfFile: pdfFileUpload ? path.relative(process.cwd(), pdfFileUpload.path) : undefined,
  coverImage: coverUpload ? path.relative(process.cwd(), coverUpload.path) : undefined,
        addedBy: req.user.userId,
      });

      const saved = await book.save();
  console.log("Book saved", saved._id);
      res.status(201).json({ message: "Book created", book: normalizeBook(saved) });
    } catch (error) {
      console.error("Create book error", error);
      res.status(400).json({ message: error.message });
    }
  }
);

// Get book by ID
router.get("/books/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json(normalizeBook(book));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update book (supports replacing PDF or cover image)
router.patch("/books/:id", auth, upload.fields([
  { name: "file", maxCount: 1 },
  { name: "cover", maxCount: 1 },
]), async (req, res) => {
  try {
    if (!["librarian", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const updatable = [
      "title",
      "author",
      "isbn",
      "description",
      "publicationYear",
      "publisher",
      "categories",
      "totalCopies",
      "availableCopies",
      "location",
      "status",
      "rating",
      "tags",
    ];
    updatable.forEach((k) => {
      if (req.body[k] !== undefined) {
        if (["categories", "tags"].includes(k)) {
          book[k] = Array.isArray(req.body[k])
            ? req.body[k]
            : req.body[k]
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean);
        } else if (["totalCopies", "availableCopies", "publicationYear", "rating"].includes(k)) {
          book[k] = Number(req.body[k]);
        } else {
          book[k] = req.body[k];
        }
      }
    });

    const files = req.files || {};
    const pdfFileUpload = Array.isArray(files.file) ? files.file[0] : null;
    const coverUpload = Array.isArray(files.cover) ? files.cover[0] : null;
    if (pdfFileUpload) {
      book.pdfFile = path.relative(process.cwd(), pdfFileUpload.path);
    }
    if (coverUpload) {
      book.coverImage = path.relative(process.cwd(), coverUpload.path);
    }
    book.updatedAt = new Date();
    const updated = await book.save();
    res.json({ message: "Book updated", book: normalizeBook(updated) });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete book
router.delete("/books/:id", auth, async (req, res) => {
  try {
    if (!["librarian", "admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    await book.deleteOne();
    res.json({ message: "Book deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
