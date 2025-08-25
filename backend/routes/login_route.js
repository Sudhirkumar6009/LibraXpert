const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/users");
const auth = require("../middleware/auth");

// Auth routes
router.post("/auth/login", async (req, res) => {
  try {
    const { emailOrEnrollment, password } = req.body;

    // Find user by email, enrollment number or username (broaden to improve UX)
    const user = await User.findOne({
      $or: [
        { email: emailOrEnrollment?.toLowerCase() },
        { enrollmentNo: emailOrEnrollment },
        { username: emailOrEnrollment }
      ],
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token (keep payload minimal)
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Standardized user object matching frontend `User` interface
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      enrollmentNo: user.enrollmentNo || undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json({ message: "Login successful", token, user: userResponse });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});

// Protected route to get current user
router.get("/auth/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        enrollmentNo: user.enrollmentNo || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
