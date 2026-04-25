const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/users");

const isAdmin = (role) => role === "admin";

router.get("/librarians", auth, async (req, res) => {
  try {
    if (!isAdmin(req.user.role)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const librarians = await User.find({ role: "librarian" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(librarians);
  } catch (error) {
    console.error("Error fetching librarians:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/librarians", auth, async (req, res) => {
  try {
    if (!isAdmin(req.user.role)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { username, email, password, firstName, lastName } = req.body || {};

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "username, email and password are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    const existing = await User.findOne({
      $or: [{ username }, { email: email.toLowerCase() }],
    });
    if (existing) {
      return res
        .status(409)
        .json({ message: "Username or email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const librarian = await User.create({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "librarian",
      firstName: firstName || "",
      lastName: lastName || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json({
      message: "Librarian created successfully",
      librarian: {
        id: librarian._id,
        username: librarian.username,
        email: librarian.email,
        role: librarian.role,
        firstName: librarian.firstName,
        lastName: librarian.lastName,
        createdAt: librarian.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating librarian:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/librarians/:id", auth, async (req, res) => {
  try {
    if (!isAdmin(req.user.role)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const librarian = await User.findById(req.params.id);
    if (!librarian) {
      return res.status(404).json({ message: "Librarian not found" });
    }

    if (librarian.role !== "librarian") {
      return res
        .status(400)
        .json({ message: "Only librarian accounts can be removed here" });
    }

    await librarian.deleteOne();

    res.json({ message: "Librarian removed successfully" });
  } catch (error) {
    console.error("Error removing librarian:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
