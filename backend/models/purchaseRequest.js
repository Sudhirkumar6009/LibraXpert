const mongoose = require("mongoose");

const purchaseRequestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    author: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    isbn: {
      type: String,
      trim: true,
      maxlength: 30,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "purchased"],
      default: "pending",
      index: true,
    },
    adminNote: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    purchasedAt: {
      type: Date,
    },
    linkedBook: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
    },
    ownedBook: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OwnedBook",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("PurchaseRequest", purchaseRequestSchema);
