const mongoose = require("mongoose");
const { DEPARTMENTS, getDepartmentName } = require("../lib/departments");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
    trim: true,
    minlength: [3, "Username must be at least 3 characters long"],
    maxlength: [20, "Username cannot exceed 20 characters"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"],
  },
  role: {
    type: String,
    required: [true, "Role is required"],
    enum: ["student", "external", "faculty", "librarian", "admin"],
    default: "student",
  },
  departmentCode: {
    type: String,
    trim: true,
    enum: DEPARTMENTS.map((department) => department.code),
    required: function () {
      return this.role === "student" || this.role === "faculty";
    },
  },
  departmentName: {
    type: String,
    trim: true,
  },
  approvalStatus: {
    type: String,
    enum: ["pending", "approved", "declined"],
    default: function () {
      return this.role === "student" ? "pending" : "approved";
    },
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  approvedAt: {
    type: Date,
  },
  approvalComment: {
    type: String,
    trim: true,
    maxlength: [500, "Approval comment cannot exceed 500 characters"],
  },
  enrollmentNo: {
    type: String,
    unique: true,
    sparse: true, // Allows null values but ensures uniqueness when present
    match: [/^\d{12}$/, "Enrollment number must be 12 digits"],
    required: function () {
      return this.role === "student";
    },
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, "First name cannot exceed 50 characters"],
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, "Last name cannot exceed 50 characters"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
userSchema.pre("save", function (next) {
  if (this.departmentCode) {
    this.departmentName =
      getDepartmentName(this.departmentCode) || this.departmentName;
  }
  this.updatedAt = Date.now();
  next();
});

userSchema.index({ role: 1, departmentCode: 1, approvalStatus: 1 });

module.exports = mongoose.model("User", userSchema);
