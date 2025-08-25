const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/users");

const router = express.Router();

// Registration route
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, role, enrollmentNo, firstName, lastName } = req.body;

    console.log("Registration attempt for:", { username, email, role });

    // Input validation
    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Username, email, and password are required"
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email format",
        message: "Please provide a valid email address"
      });
    }

    // Password length validation
    if (password.length < 6) {
      return res.status(400).json({
        error: "Password too short",
        message: "Password must be at least 6 characters long"
      });
    }

    // Role validation
    const validRoles = ["student", "external", "librarian", "admin"];
    const userRole = role || "student";
    if (!validRoles.includes(userRole)) {
      return res.status(400).json({
        error: "Invalid role",
        message: "Please select a valid user role"
      });
    }

    // Enrollment number validation for students
    if (userRole === "student" && (!enrollmentNo || !/^\d{12}$/.test(enrollmentNo))) {
      return res.status(400).json({
        error: "Invalid enrollment number",
        message: "Students must provide a valid 12-digit enrollment number"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() }, 
        { username },
        ...(enrollmentNo ? [{ enrollmentNo }] : [])
      ]
    });

    if (existingUser) {
      let message = "User already exists";
      if (existingUser.email === email.toLowerCase()) {
        message = "Email already registered";
      } else if (existingUser.username === username) {
        message = "Username already taken";
      } else if (existingUser.enrollmentNo === enrollmentNo) {
        message = "Enrollment number already registered";
      }
      
      return res.status(409).json({
        error: "User already exists",
        message
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const userData = {
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: userRole,
      firstName: firstName || "",
      lastName: lastName || "",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add enrollment number only for students
    if (userRole === "student" && enrollmentNo) {
      userData.enrollmentNo = enrollmentNo;
    }

    const newUser = new User(userData);

    // Save user to database
    const savedUser = await newUser.save();
    console.log("User saved successfully:", savedUser._id);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: savedUser._id, // align with login route
        role: savedUser.role
      },
      process.env.JWT_SECRET || "fallback_secret_key",
      { expiresIn: "24h" }
    );

    // Return success response (don't send password back)
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        role: savedUser.role,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        enrollmentNo: savedUser.enrollmentNo,
        createdAt: savedUser.createdAt,
        updatedAt: savedUser.updatedAt,
      },
      token
    });

  } catch (error) {
    console.error("Registration error:", error);
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        error: "Duplicate field",
        message: `${field} already exists`
      });
    }

    // Handle MongoDB validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: "Validation failed",
        message: validationErrors.join(", ")
      });
    }

    // Generic server error
    res.status(500).json({
      error: "Internal server error",
      message: "Registration failed. Please try again later."
    });
  }
});

module.exports = router;
