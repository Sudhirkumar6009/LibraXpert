const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const BorrowRequest = require('../models/borrowRequest');
const Book = require('../models/books');
const Notification = require('../models/notification');
const User = require('../models/users');

// Create a borrow request (students/external)
router.post('/borrow-requests', auth, async (req, res) => {
  try {
    const { bookId, message } = req.body;
    if (!bookId) return res.status(400).json({ message: 'bookId is required' });

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    const existing = await BorrowRequest.findOne({ book: bookId, user: req.user.userId, status: 'pending' });
    if (existing) return res.status(409).json({ message: 'You already have a pending request for this book' });

    const br = new BorrowRequest({ book: bookId, user: req.user.userId, message });
    await br.save();

    // Load requester info to include enrollment/username in notifications
    let requester = null;
    try {
      requester = await User.findById(req.user.userId).select('enrollmentNo username email');
    } catch (e) {
      // ignore
    }
    const requesterName = (requester && (requester.enrollmentNo || requester.username || requester.email)) || 'Unknown user';

    // Notify all librarians/admins - create notifications targeted to those users
    const librarians = await User.find({ role: { $in: ['librarian', 'admin'] } });
    const notifications = librarians.map((l) => ({
      user: l._id,
      title: 'New borrow request',
      message: `${requesterName} requested to borrow "${book.title}"`,
      type: 'borrow_request',
      actionLink: `/management/borrow-requests`,
    }));
    if (notifications.length) await Notification.insertMany(notifications);

    res.status(201).json({ message: 'Borrow request created' });
  } catch (err) {
    console.error('Create borrow request error', err);
    res.status(500).json({ message: err.message });
  }
});

// List pending borrow requests (librarian/admin)
router.get('/borrow-requests', auth, async (req, res) => {
  try {
    if (!['librarian', 'admin'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    const requests = await BorrowRequest.find().populate('book').populate('user').sort({ requestedAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve a borrow request
router.post('/borrow-requests/:id/approve', auth, async (req, res) => {
  try {
    if (!['librarian', 'admin'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    const reqDoc = await BorrowRequest.findById(req.params.id).populate('book').populate('user');
    if (!reqDoc) return res.status(404).json({ message: 'Request not found' });
    if (reqDoc.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

    // Simple availability check
    if (reqDoc.book.availableCopies <= 0) return res.status(400).json({ message: 'No available copies' });

    reqDoc.status = 'approved';
    reqDoc.processedBy = req.user.userId;
    reqDoc.processedAt = new Date();
    await reqDoc.save();

    // Decrement available copies
    reqDoc.book.availableCopies = Math.max(0, reqDoc.book.availableCopies - 1);
    await reqDoc.book.save();

    // Notify requester
    const notif = new Notification({
      user: reqDoc.user._id,
      title: 'Borrow request approved',
      message: `Your request to borrow "${reqDoc.book.title}" has been approved.`,
      type: 'borrow_approved',
      actionLink: '/loans'
    });
    await notif.save();

    res.json({ message: 'Request approved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Decline a borrow request
router.post('/borrow-requests/:id/decline', auth, async (req, res) => {
  try {
    if (!['librarian', 'admin'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    const reqDoc = await BorrowRequest.findById(req.params.id).populate('book').populate('user');
    if (!reqDoc) return res.status(404).json({ message: 'Request not found' });
    if (reqDoc.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

    reqDoc.status = 'declined';
    reqDoc.processedBy = req.user.userId;
    reqDoc.processedAt = new Date();
    await reqDoc.save();

    const notif = new Notification({
      user: reqDoc.user._id,
      title: 'Borrow request declined',
      message: `Your request to borrow "${reqDoc.book.title}" has been declined.`,
      type: 'borrow_declined'
    });
    await notif.save();

    res.json({ message: 'Request declined' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get notifications for current user
router.get('/notifications', auth, async (req, res) => {
  try {
    const notifs = await Notification.find({ user: req.user.userId }).sort({ createdAt: -1 });
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark notification read
router.post('/notifications/:id/read', auth, async (req, res) => {
  try {
    const n = await Notification.findById(req.params.id);
    if (!n) return res.status(404).json({ message: 'Notification not found' });
    if (String(n.user) !== String(req.user.userId)) return res.status(403).json({ message: 'Forbidden' });
    n.isRead = true;
    await n.save();
    res.json({ message: 'Marked read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
