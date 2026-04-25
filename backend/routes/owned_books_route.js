const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const OwnedBook = require("../models/ownedBook");

const isLibrarian = (role) => ["librarian", "admin"].includes(role);

router.get("/my-owned-books", auth, async (req, res) => {
  try {
    const books = await OwnedBook.find({ user: req.user.userId })
      .populate("book", "title author coverImage")
      .sort({ createdAt: -1 });

    res.json(books);
  } catch (error) {
    console.error("Error fetching owned books:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    if (!isLibrarian(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const books = await OwnedBook.find()
      .populate("user", "username firstName lastName email enrollmentNo")
      .populate("book", "title author coverImage")
      .sort({ createdAt: -1 });

    res.json(books);
  } catch (error) {
    console.error("Error fetching all owned books:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
