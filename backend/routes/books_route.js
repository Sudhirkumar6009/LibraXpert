const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
// ImageKit for storing covers; if IMAGEKIT_* env vars are not present or upload fails we fallback to local disk
let ImageKitClient = null;
try {
  const ImageKit = require("imagekit");
  ImageKitClient = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  });
} catch (e) {
  console.warn("imagekit library not available. Install with: npm install imagekit");
}
const Book = require("../models/books");
const auth = require("../middleware/auth");

// Firebase Admin (optional) - used to upload PDFs to Firebase Storage when service account is provided.
let firebaseAdmin = null;
let firebaseBucket = null;
let firebaseInited = false;
function initFirebaseAdmin() {
  if (firebaseInited) return true;
  try {
    const admin = require("firebase-admin");
    let serviceAccount = null;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    } else {
      // Try auto-detect common filename in backend folder
      const localPaths = [
        path.join(process.cwd(), "service_account.json"),
        path.join(process.cwd(), "service-account.json"),
        path.join(process.cwd(), "firebase-service-account.json"),
      ];
      for (const p of localPaths) {
        if (fs.existsSync(p)) {
          serviceAccount = require(p);
          break;
        }
      }
      if (!serviceAccount) {
        // No service account provided
        return false;
      }
    }
    // Derive bucket name if not explicitly provided
    let bucketName = process.env.FIREBASE_STORAGE_BUCKET;
    if (!bucketName && serviceAccount && serviceAccount.project_id) {
      bucketName = `${serviceAccount.project_id}.appspot.com`;
    }
    
    console.log("Initializing Firebase with bucket:", bucketName);
    
    const initOptions = { credential: admin.credential.cert(serviceAccount) };
    if (bucketName) initOptions.storageBucket = bucketName;
    admin.initializeApp(initOptions);
    firebaseAdmin = admin;
    try {
      firebaseBucket = bucketName ? admin.storage().bucket(bucketName) : admin.storage().bucket();
    } catch (e) {
      console.error("Failed to get firebase bucket:", e && e.message ? e.message : e);
      throw e;
    }
    firebaseInited = true;
    console.log("Firebase admin initialized for storage uploads");
    return true;
  } catch (err) {
    console.warn("Failed to initialize Firebase Admin:", err && err.message ? err.message : err);
    return false;
  }
}

async function deleteFromFirebase(fileUrl) {
  if (!initFirebaseAdmin() || !fileUrl) return;
  try {
    // Extract the file path from the URL
    const url = new URL(fileUrl);
    const pathSegments = url.pathname.split('/');
    const filePath = pathSegments.slice(4).join('/'); // Remove '/v0/b/bucket/o/'
    if (filePath) {
      await firebaseBucket.file(filePath).delete();
      console.log(`Deleted from Firebase: ${filePath}`);
    }
  } catch (err) {
    console.error("Firebase delete failed:", err && err.message ? err.message : err);
  }
}

async function deleteFromImageKit(fileUrl) {
  if (!ImageKitClient || !fileUrl) return;
  try {
    // ImageKit URLs typically have the file ID in the path
    const url = new URL(fileUrl);
    const pathSegments = url.pathname.split('/');
    const fileId = pathSegments[pathSegments.length - 1];
    if (fileId) {
      await ImageKitClient.deleteFile(fileId);
      console.log(`Deleted from ImageKit: ${fileId}`);
    }
  } catch (err) {
    console.error("ImageKit delete failed:", err && err.message ? err.message : err);
  }
}

// Helper: upload a buffer to Firebase Storage and return the public URL. Returns undefined on failure.
async function uploadBufferToFirebase(filename, buffer, mimetype) {
  if (!initFirebaseAdmin() || !firebaseBucket) return undefined;
  try {
    const filePath = `books/${filename}`;
    const file = firebaseBucket.file(filePath);
    
    // Upload the buffer to Firebase Storage
    await file.save(buffer, {
      metadata: {
        contentType: mimetype,
      },
      public: true, // Make the file publicly accessible
    });
    
    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${firebaseBucket.name}/${filePath}`;
    console.log(`Uploaded to Firebase: ${filePath}`);
    return publicUrl;
  } catch (err) {
    console.error("Firebase upload failed:", err && err.message ? err.message : err);
    return undefined;
  }
}

// Ensure uploads and covers directories exist
const uploadDir = path.join(process.cwd(), "uploads", "books");
fs.mkdirSync(uploadDir, { recursive: true });
const coversDir = path.join(process.cwd(), "data", "covers");
fs.mkdirSync(coversDir, { recursive: true });

// Multer: use memoryStorage for file (pdf) and diskStorage for cover image
const memoryStorage = multer.memoryStorage();
const coverStorage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, coversDir);
  },
  filename: function (_req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || ".png";
    cb(null, unique + ext.toLowerCase());
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") return cb(null, true);
  // Allow common image types for cover images if desired
  if (/^image\//.test(file.mimetype)) return cb(null, true);
  cb(new Error("Only PDF or image files are allowed"));
};

// We'll accept fields; pdfs come in memory, covers are written to disk directly
const upload = multer({ storage: memoryStorage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } });

// Helper: upload a cover buffer to ImageKit and return the public URL. Returns undefined on failure.
async function uploadBufferToImageKit(filename, buffer, mimetype) {
  if (!ImageKitClient) return undefined;
  if (!process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
    console.warn("IMAGEKIT credentials not set; skipping ImageKit upload");
    return undefined;
  }
  try {
    const base64 = buffer.toString("base64");
    const file = `data:${mimetype};base64,${base64}`;
    const res = await ImageKitClient.upload({ file, fileName: filename });
    if (res && (res.url || res.filePath)) return res.url || res.filePath;
  } catch (err) {
    console.error("ImageKit upload failed:", err && err.message ? err.message : err);
  }
  return undefined;
}

// Sanitize uploaded filenames and strip leading numeric prefixes like 1756209176594-
function sanitizeFilename(original) {
  if (!original || typeof original !== 'string') return 'file';
  // Remove any path segments
  let name = original.split(/[/\\]/).pop();
  // Remove leading numeric timestamp-like prefix (e.g., 1756209176594- or 1756209176594_)
  name = name.replace(/^[0-9]+[-_]+/, '');
  // Replace problematic chars with underscore, but keep dot, dash and underscore
  name = name.replace(/[^a-zA-Z0-9._-]/g, '_');
  // Avoid empty
  if (!name) name = 'file';
  return name;
}

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
  // Sanitize any accidentally stored function source (earlier bug where function reference was stringified)
  const sanitize = (v) => {
    if (!v) return v;
    if (typeof v !== "string") return v;
    if (/function\s+link\s*\(|link\(options,\s*originalCb\)/.test(v)) return undefined;
    return v;
  };
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
  coverImage: sanitize(b.coverImage),
  pdfFile: sanitize(b.pdfFile),
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

      // Basic validation to return helpful 400 errors early
      if (!title || !author) {
        return res.status(400).json({ message: "Title and author are required" });
      }

      // Log file info for debugging
      console.log("Files received:", Object.keys(files));
      if (pdfFileUpload) console.log("PDF size:", pdfFileUpload.size, "bytes", "mimetype:", pdfFileUpload.mimetype);
      if (coverUpload) console.log("Cover size:", coverUpload.size, "bytes", "mimetype:", coverUpload.mimetype);

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
  pdfFile: undefined,
  coverImage: undefined,
        addedBy: req.user.userId,
      });

    // If files are provided, try uploading to Mega first, else fallback to disk.
    if (pdfFileUpload) {
      const base = sanitizeFilename(pdfFileUpload.originalname);
      // Add small random suffix to avoid collisions but keep original readable name
      const suffix = Math.floor(Math.random() * 10000);
      const filename = `${base.replace(/\.([^.]+)$/, '')}-${suffix}.${(base.match(/\.([^.]+)$/) || [])[1] || 'pdf'}`;
        // Try Firebase Storage first
        console.log("initFirebaseAdmin?", initFirebaseAdmin());
        let uploadedUrl;
        try {
          uploadedUrl = await uploadBufferToFirebase(filename, pdfFileUpload.buffer, pdfFileUpload.mimetype);
          console.log("uploadBufferToFirebase returned:", uploadedUrl);
        } catch (e) {
          console.error("uploadBufferToFirebase threw:", e && e.message ? e.message : e);
          uploadedUrl = undefined;
        }
        if (uploadedUrl) {
          console.log("Using Firebase URL for PDF:", uploadedUrl);
          book.pdfFile = uploadedUrl;
        } else {
          console.log("Falling back to local disk for PDF");
          const outPath = path.join(uploadDir, filename);
          fs.writeFileSync(outPath, pdfFileUpload.buffer);
          book.pdfFile = path.relative(process.cwd(), outPath);
        }
    }

    if (coverUpload) {
      // Prefer to upload cover to ImageKit (server-side cloud) and store the returned URL.
      // If ImageKit upload fails or is not configured, fall back to saving locally under data/covers
      let coverStoredValue;
      if (coverUpload && coverUpload.buffer) {
        const filename = Date.now() + "-" + coverUpload.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
        const uploadedUrl = await uploadBufferToImageKit(filename, coverUpload.buffer, coverUpload.mimetype);
        if (uploadedUrl) {
          coverStoredValue = uploadedUrl;
        } else {
          const outPath = path.join(coversDir, filename);
          fs.writeFileSync(outPath, coverUpload.buffer);
          coverStoredValue = path.posix.join("covers", path.basename(outPath)).replace(/^[\\/]+/, "");
        }
      } else if (coverUpload && coverUpload.path) {
        // already written to disk by multer.diskStorage (rare in current config)
        coverStoredValue = path.posix.join("covers", path.basename(coverUpload.path)).replace(/^[\\/]+/, "");
      }
      if (coverStoredValue) book.coverImage = coverStoredValue;
    }

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
      const base = sanitizeFilename(pdfFileUpload.originalname);
      const suffix = Math.floor(Math.random() * 10000);
      const filename = `${base.replace(/\.([^.]+)$/, '')}-${suffix}.${(base.match(/\.([^.]+)$/) || [])[1] || 'pdf'}`;
      console.log("initFirebaseAdmin?", initFirebaseAdmin());
      let uploadedUrl;
      try {
        uploadedUrl = await uploadBufferToFirebase(filename, pdfFileUpload.buffer, pdfFileUpload.mimetype);
        console.log("uploadBufferToFirebase returned:", uploadedUrl);
      } catch (e) {
        console.error("uploadBufferToFirebase threw:", e && e.message ? e.message : e);
        uploadedUrl = undefined;
      }
      if (uploadedUrl) {
        console.log("Using Firebase URL for PDF:", uploadedUrl);
        book.pdfFile = uploadedUrl;
      } else {
        console.log("Falling back to local disk for PDF");
        const outPath = path.join(uploadDir, filename);
        fs.writeFileSync(outPath, pdfFileUpload.buffer);
        book.pdfFile = path.relative(process.cwd(), outPath);
      }
    }
    if (coverUpload) {
      // Delete old cover image if it exists
      if (book.coverImage) {
        if (book.coverImage.includes('imagekit.io')) {
          await deleteFromImageKit(book.coverImage);
        } else if (book.coverImage.includes('firebase')) {
          await deleteFromFirebase(book.coverImage);
        } else {
          // Local file, delete from disk
          const localPath = path.join(process.cwd(), book.coverImage);
          if (fs.existsSync(localPath)) {
            fs.unlinkSync(localPath);
          }
        }
      }

      let coverStoredValue;
      if (coverUpload && coverUpload.buffer) {
        const filename = Date.now() + "-" + coverUpload.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
        const uploadedUrl = await uploadBufferToImageKit(filename, coverUpload.buffer, coverUpload.mimetype);
        if (uploadedUrl) {
          coverStoredValue = uploadedUrl;
        } else {
          const outPath = path.join(coversDir, filename);
          fs.writeFileSync(outPath, coverUpload.buffer);
          coverStoredValue = path.posix.join("covers", path.basename(outPath)).replace(/^[\\/]+/, "");
        }
      } else if (coverUpload && coverUpload.path) {
        coverStoredValue = path.posix.join("covers", path.basename(coverUpload.path)).replace(/^[\\/]+/, "");
      }
      if (coverStoredValue) book.coverImage = coverStoredValue;
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

    // Delete cover image if it exists
    if (book.coverImage) {
      if (book.coverImage.includes('imagekit.io')) {
        await deleteFromImageKit(book.coverImage);
      } else if (book.coverImage.includes('firebase')) {
        await deleteFromFirebase(book.coverImage);
      } else {
        // Local file, delete from disk
        const localPath = path.join(process.cwd(), book.coverImage);
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
        }
      }
    }

    // Delete PDF file if it exists
    if (book.pdfFile) {
      if (book.pdfFile.includes('firebase')) {
        await deleteFromFirebase(book.pdfFile);
      } else {
        // Local file, delete from disk
        const localPath = path.join(process.cwd(), book.pdfFile);
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
        }
      }
    }

    await book.deleteOne();
    res.json({ message: "Book deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

// Expose a helper to allow the server to check Firebase Storage connectivity at startup
module.exports.initFirebaseCheck = async function () {
  try {
    const inited = initFirebaseAdmin();
    if (!inited) {
      console.log("Firebase admin not configured or service account missing");
      return false;
    }
    if (!firebaseBucket) {
      console.warn("Firebase bucket not available after init");
      return false;
    }
    try {
      const [exists] = await firebaseBucket.exists();
      if (exists) {
        console.log("Firebase Storage connected");
        return true;
      } else {
        console.warn("Firebase Storage bucket not reachable");
        return false;
      }
    } catch (err) {
      console.error("Error checking firebase bucket existence:", err && err.message ? err.message : err);
      return false;
    }
  } catch (e) {
    console.error("initFirebaseCheck failed:", e && e.message ? e.message : e);
    return false;
  }
};
