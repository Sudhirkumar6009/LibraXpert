const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'librarian', 'admin', 'external'],
        default: 'student'
    },
    enrollmentNo: {
        type: String,
        unique: true,
        sparse: true
    },
    department: String,
    year: String,
    profileImage: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("User", userSchema);