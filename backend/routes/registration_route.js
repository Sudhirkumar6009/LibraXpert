const express = require("express");
const router = express.Router();
const User = require("../models/users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken"); // Add this line

router.post("/register", async (req, res) => {
  try {
    console.log("Received registration request:", req.body);

    const { name, email, password, role, enrollmentNo, department, year } =
      req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email }, { enrollmentNo: enrollmentNo }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists with this email or enrollment number",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      enrollmentNo,
      department,
      year,
      profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Send response with token
    res.status(201).json({
      message: "Registration successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        enrollmentNo: user.enrollmentNo,
        profileImage: user.profileImage,
      },
      token: token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
});

module.exports = router;
