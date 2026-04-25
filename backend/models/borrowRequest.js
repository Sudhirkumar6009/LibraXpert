const mongoose = require("mongoose");

const borrowRequestSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    enum: ["pending", "approved", "declined"],
    default: "pending",
  },
  requestedAt: { type: Date, default: Date.now },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  processedAt: { type: Date },
  approvedAt: { type: Date },
  rejectedAt: { type: Date },
  dueDate: { type: Date },
  returnDate: { type: Date },
  returned: { type: Boolean, default: false },
  returnedAt: { type: Date },
  finePerDay: { type: Number, default: 1, min: 0 },
  overdueDays: { type: Number, default: 0, min: 0 },
  fineAmount: { type: Number, default: 0, min: 0 },
  fineStatus: {
    type: String,
    enum: ["none", "pending_payment", "paid"],
    default: "none",
  },
  fineApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  fineApprovedAt: { type: Date },
  renewalCount: { type: Number, default: 0 },
  lastRenewedAt: { type: Date },
  renewalStatus: {
    type: String,
    enum: ["none", "pending", "approved", "declined"],
    default: "none",
  },
  renewalRequestedAt: { type: Date },
  renewalDecisionBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  renewalDecisionAt: { type: Date },
  renewalNotes: { type: String },
  notes: { type: String },
  message: { type: String },
});

module.exports = mongoose.model("BorrowRequest", borrowRequestSchema);
