const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/users");
const Notification = require("../models/notification");
const {
  isValidDepartmentCode,
  getDepartmentName,
} = require("../lib/departments");

const router = express.Router();

// Registration route
router.post("/register", async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      role,
      enrollmentNo,
      departmentCode,
      firstName,
      lastName,
    } = req.body;

    console.log("Registration attempt for:", { username, email, role });

    // Input validation
    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Username, email, and password are required",
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email format",
        message: "Please provide a valid email address",
      });
    }

    // Password length validation
    if (password.length < 6) {
      return res.status(400).json({
        error: "Password too short",
        message: "Password must be at least 6 characters long",
      });
    }

    // Role validation
    const validRoles = ["student", "external", "faculty", "librarian"];
    const userRole = role || "student";
    if (!validRoles.includes(userRole)) {
      return res.status(400).json({
        error: "Invalid role",
        message: "Please select a valid user role",
      });
    }

    const extractDepartmentCodeFromEnrollment = (value) => {
      if (!value || typeof value !== "string" || value.length !== 12)
        return undefined;
      return value.slice(7, 9);
    };

    // Enrollment number validation for students
    if (
      userRole === "student" &&
      (!enrollmentNo || !/^\d{12}$/.test(enrollmentNo))
    ) {
      return res.status(400).json({
        error: "Invalid enrollment number",
        message: "Students must provide a valid 12-digit enrollment number",
      });
    }

    let resolvedDepartmentCode = undefined;
    if (userRole === "student") {
      resolvedDepartmentCode =
        extractDepartmentCodeFromEnrollment(enrollmentNo);
      if (!isValidDepartmentCode(resolvedDepartmentCode)) {
        return res.status(400).json({
          error: "Invalid department code",
          message: "Department code derived from enrollment number is invalid",
        });
      }
    }

    if (userRole === "faculty") {
      resolvedDepartmentCode = String(departmentCode || "");
      if (!isValidDepartmentCode(resolvedDepartmentCode)) {
        return res.status(400).json({
          error: "Invalid department code",
          message: "Faculty registration requires a valid department code",
        });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username },
        ...(enrollmentNo ? [{ enrollmentNo }] : []),
      ],
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
        message,
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
      departmentCode: resolvedDepartmentCode,
      departmentName: resolvedDepartmentCode
        ? getDepartmentName(resolvedDepartmentCode)
        : undefined,
      approvalStatus: userRole === "student" ? "pending" : "approved",
      firstName: firstName || "",
      lastName: lastName || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add enrollment number only for students
    if (userRole === "student" && enrollmentNo) {
      userData.enrollmentNo = enrollmentNo;
    }

    const newUser = new User(userData);

    // Save user to database
    const savedUser = await newUser.save();
    console.log("User saved successfully:", savedUser._id);

    if (savedUser.role === "student") {
      const targetFaculty = await User.find({
        role: "faculty",
        approvalStatus: "approved",
        departmentCode: savedUser.departmentCode,
      }).select("_id");

      const targetAdmins = targetFaculty.length
        ? []
        : await User.find({ role: "admin" }).select("_id");

      const recipients = targetFaculty.length ? targetFaculty : targetAdmins;
      if (recipients.length) {
        await Notification.insertMany(
          recipients.map((person) => ({
            user: person._id,
            title: "Student registration approval needed",
            message: `${savedUser.username} (${savedUser.enrollmentNo}) registered as student for ${savedUser.departmentName || savedUser.departmentCode}.`,
            type: "student_registration_approval",
            relatedId: savedUser._id,
            actionLink: "/faculty/student-registrations",
          })),
        );
      }

      return res.status(202).json({
        message:
          "Student account created and sent for faculty approval. You can log in after approval.",
        user: {
          id: savedUser._id,
          username: savedUser.username,
          email: savedUser.email,
          role: savedUser.role,
          firstName: savedUser.firstName,
          lastName: savedUser.lastName,
          enrollmentNo: savedUser.enrollmentNo,
          departmentCode: savedUser.departmentCode,
          departmentName: savedUser.departmentName,
          approvalStatus: savedUser.approvalStatus,
          createdAt: savedUser.createdAt,
          updatedAt: savedUser.updatedAt,
        },
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: savedUser._id, // align with login route
        role: savedUser.role,
      },
      process.env.JWT_SECRET || "fallback_secret_key",
      { expiresIn: "24h" },
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
        departmentCode: savedUser.departmentCode,
        departmentName: savedUser.departmentName,
        approvalStatus: savedUser.approvalStatus,
        createdAt: savedUser.createdAt,
        updatedAt: savedUser.updatedAt,
      },
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        error: "Duplicate field",
        message: `${field} already exists`,
      });
    }

    // Handle MongoDB validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message,
      );
      return res.status(400).json({
        error: "Validation failed",
        message: validationErrors.join(", "),
      });
    }

    // Generic server error
    res.status(500).json({
      error: "Internal server error",
      message: "Registration failed. Please try again later.",
    });
  }
});

module.exports = router;
