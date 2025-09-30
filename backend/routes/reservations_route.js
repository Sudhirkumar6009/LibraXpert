const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Reservation = require('../models/reservation');
const Book = require('../models/books');
const Notification = require('../models/notification');

// Create a new reservation (for unavailable books)
router.post('/', auth, async (req, res) => {
  try {
    const { bookId } = req.body;
    
    if (!bookId) {
      return res.status(400).json({ message: 'Book ID is required' });
    }
    
    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Check if book is available - only allow reservations for unavailable books
    if ((book.availableCopies ?? 0) > 0) {
      return res.status(400).json({ 
        message: 'This book is currently available. Please borrow it directly instead of reserving.' 
      });
    }
    
    // Check if user already has a pending reservation for this book
    const existingReservation = await Reservation.findOne({ 
      book: bookId, 
      user: req.user.userId,
      status: 'pending'
    });
    
    if (existingReservation) {
      return res.status(409).json({ 
        message: 'You already have a pending reservation for this book' 
      });
    }
    
    // Calculate expiry date (30 days from now)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    
    // Create reservation
    const reservation = new Reservation({
      book: bookId,
      user: req.user.userId,
      expiryDate: expiryDate,
      status: 'pending'
    });
    
    await reservation.save();
    
    // Notify librarians about the reservation
    const notification = new Notification({
      user: req.user.userId,
      title: 'Book Reservation Confirmed',
      message: `Your reservation for "${book.title}" has been confirmed. We'll notify you when the book becomes available.`,
      type: 'reservation_created',
      relatedId: reservation._id
    });
    
    await notification.save();
    
    res.status(201).json({
      message: 'Reservation created successfully. You will be notified when the book becomes available.',
      reservation
    });
    
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's reservations
router.get('/my-reservations', auth, async (req, res) => {
  try {
    const reservations = await Reservation.find({ 
      user: req.user.userId 
    })
    .populate('book')
    .sort({ requestedAt: -1 });
    
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel a reservation
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    
    // Check if this is the user's reservation
    if (reservation.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to cancel this reservation' });
    }
    
    if (reservation.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending reservations can be cancelled' });
    }
    
    // Update reservation
    reservation.status = 'cancelled';
    reservation.cancelledAt = new Date();
    reservation.cancelReason = req.body.reason || 'Cancelled by user';
    
    await reservation.save();
    
    // Notify user
    const book = await Book.findById(reservation.book);
    const notification = new Notification({
      user: req.user.userId,
      title: 'Reservation Cancelled',
      message: `Your reservation for "${book.title}" has been cancelled.`,
      type: 'reservation_cancelled',
      relatedId: reservation._id
    });
    
    await notification.save();
    
    res.json({
      message: 'Reservation cancelled successfully',
      reservation
    });
    
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// This endpoint will be called when a book is returned
// to notify users with pending reservations
router.post('/notify-availability/:bookId', auth, async (req, res) => {
  try {
    // Check if user is librarian or admin
    if (req.user.role !== 'librarian' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const bookId = req.params.bookId;
    const book = await Book.findById(bookId);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Find oldest pending reservation for this book
    const oldestReservation = await Reservation.findOne({ 
      book: bookId, 
      status: 'pending',
      notifiedUser: false
    })
    .sort({ requestedAt: 1 })
    .populate('user');
    
    if (!oldestReservation) {
      return res.status(404).json({ message: 'No pending reservations for this book' });
    }
    
    // Mark the reservation as fulfilled
    oldestReservation.status = 'fulfilled';
    oldestReservation.fulfilledAt = new Date();
    oldestReservation.notifiedUser = true;
    
    // Calculate pickup deadline (48 hours from now)
    const pickupDeadline = new Date();
    pickupDeadline.setHours(pickupDeadline.getHours() + 48);
    
    await oldestReservation.save();
    
    // Create notification for the user
    const notification = new Notification({
      user: oldestReservation.user._id,
      title: 'Book Available for Pickup',
      message: `Good news! "${book.title}" is now available for pickup. Please collect it within 48 hours or your reservation will expire.`,
      type: 'book_available',
      relatedId: oldestReservation._id,
      actionLink: `/book/${bookId}`
    });
    
    await notification.save();
    
    res.json({
      message: 'User notified about book availability',
      reservation: oldestReservation
    });
    
  } catch (error) {
    console.error('Error notifying about book availability:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin/Librarian route to get all pending reservations
router.get('/pending', auth, async (req, res) => {
  try {
    // Check if user is librarian or admin
    if (req.user.role !== 'librarian' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const reservations = await Reservation.find({ status: 'pending' })
      .populate('book')
      .populate('user')
      .sort({ requestedAt: 1 });
    
    res.json(reservations);
  } catch (error) {
    console.error('Error fetching pending reservations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;