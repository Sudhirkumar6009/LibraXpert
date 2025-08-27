const mongoose = require('mongoose');

const borrowRequestSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'declined'], default: 'pending' },
  requestedAt: { type: Date, default: Date.now },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedAt: { type: Date },
  message: { type: String },
});

module.exports = mongoose.model('BorrowRequest', borrowRequestSchema);
