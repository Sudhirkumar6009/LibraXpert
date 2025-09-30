const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'fulfilled', 'expired', 'cancelled'], 
    default: 'pending' 
  },
  requestedAt: { type: Date, default: Date.now },
  expiryDate: { type: Date, required: true }, // When the reservation expires if not claimed
  notifiedUser: { type: Boolean, default: false }, // Whether the user has been notified of book availability
  fulfilledAt: { type: Date }, // When the book became available and was reserved for this user
  cancelledAt: { type: Date },
  cancelReason: { type: String },
  notes: { type: String }
});

module.exports = mongoose.model('Reservation', reservationSchema);