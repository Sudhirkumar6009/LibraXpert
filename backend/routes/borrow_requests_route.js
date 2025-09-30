const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const BorrowRequest = require('../models/borrowRequest');
const Book = require('../models/books');
const Notification = require('../models/notification');
const User = require('../models/users');

// Create a borrow request (students/external)
router.post('/', auth, async (req, res) => {
  try {
    const { bookId, message } = req.body;
    if (!bookId) return res.status(400).json({ message: 'bookId is required' });

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    if ((book.availableCopies ?? 0) <= 0) {
      return res.status(400).json({ message: 'No copies available for this book' });
    }

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
      relatedId: br._id,
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
router.get('/', auth, async (req, res) => {
  try {
    if (!['librarian', 'admin'].includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    const requests = await BorrowRequest.find().populate('book').populate('user').sort({ requestedAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve a borrow request
router.post('/:id/approve', auth, async (req, res) => {
  try {
    // Check if user is librarian or admin
    if (req.user.role !== 'librarian' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to approve requests' });
    }

    const requestId = req.params.id;
    const borrowRequest = await BorrowRequest.findById(requestId)
      .populate('book')
      .populate('user');

    if (!borrowRequest) {
      return res.status(404).json({ message: 'Borrow request not found' });
    }

    if (borrowRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not pending' });
    }

    const bookDoc = borrowRequest.book && borrowRequest.book._id ? borrowRequest.book : await Book.findById(borrowRequest.book);
    if (!bookDoc) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Check if book is available
    if ((bookDoc.availableCopies ?? 0) <= 0) {
      return res.status(400).json({ message: 'No copies available for loan' });
    }

    // Set loan due date (e.g., 14 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // 14 days loan period

    // Update the borrow request
    borrowRequest.status = 'approved';
    borrowRequest.approvedAt = new Date();
    borrowRequest.dueDate = dueDate;
    borrowRequest.processedBy = req.user.userId;
    borrowRequest.processedAt = new Date();
    borrowRequest.returned = false;
    await borrowRequest.save();

    // Decrease available copies
    bookDoc.availableCopies = Math.max(0, (bookDoc.availableCopies ?? 0) - 1);
    await bookDoc.save();

    // Find and delete any pending notifications about this request for librarians
    await Notification.deleteMany({
      relatedId: borrowRequest._id,
      type: 'borrow_request'
    });

    // Create notification for the borrower
    const borrowerId = borrowRequest.user && borrowRequest.user._id ? borrowRequest.user._id : borrowRequest.user;
    const notification = new Notification({
      user: borrowerId,
      title: 'Loan Request Approved',
      message: `Your request to borrow "${bookDoc.title}" has been approved. Due date: ${dueDate.toLocaleString()}`,
      type: 'loan_approved',
      relatedId: borrowRequest._id,
      actionLink: '/loans'
    });
    await notification.save();

    res.json({
      message: 'Borrow request approved successfully',
      borrowRequest
    });
  } catch (error) {
    console.error('Error approving borrow request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Decline a borrow request
router.post('/:id/decline', auth, async (req, res) => {
  try {
    // Check if user is librarian or admin
    if (req.user.role !== 'librarian' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to decline requests' });
    }

    const requestId = req.params.id;
    const borrowRequest = await BorrowRequest.findById(requestId)
      .populate('book')
      .populate('user');

    if (!borrowRequest) {
      return res.status(404).json({ message: 'Borrow request not found' });
    }

    if (borrowRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Request is not pending' });
    }

    const bookDoc = borrowRequest.book && borrowRequest.book._id ? borrowRequest.book : await Book.findById(borrowRequest.book);
    if (!bookDoc) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Update the borrow request
    borrowRequest.status = 'declined';
    borrowRequest.rejectedAt = new Date();
    borrowRequest.notes = req.body.reason || 'Request declined by librarian';
    borrowRequest.processedBy = req.user.userId;
    borrowRequest.processedAt = new Date();
    await borrowRequest.save();

    // Find and delete any pending notifications about this request for librarians
    await Notification.deleteMany({
      relatedId: borrowRequest._id,
      type: 'borrow_request'
    });

    // Create notification for the borrower
    const borrowerId = borrowRequest.user && borrowRequest.user._id ? borrowRequest.user._id : borrowRequest.user;
    const notification = new Notification({
      user: borrowerId,
      title: 'Loan Request Declined',
      message: `Your request to borrow "${bookDoc.title}" has been declined. ${borrowRequest.notes}`,
      type: 'loan_declined',
      relatedId: borrowRequest._id
    });
    await notification.save();

    res.json({
      message: 'Borrow request declined successfully',
      borrowRequest
    });
  } catch (error) {
    console.error('Error declining borrow request:', error);
    res.status(500).json({ message: 'Server error' });
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

// Get all pending borrow requests (for librarians)
router.get('/pending', auth, async (req, res) => {
  try {
    // Check if user is librarian or admin
    if (req.user.role !== 'librarian' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view requests' });
    }

    // Find all pending requests
    const requests = await BorrowRequest.find({ status: 'pending' })
      .populate('book')
      .populate('user')
      .sort({ requestedAt: -1 });

    // Enhance with book and user details
    const enhancedRequests = await Promise.all(
      requests.map(async (request) => {
        const book = request.book && request.book._id ? request.book : await Book.findById(request.book);
        const user = request.user && request.user._id ? request.user : await User.findById(request.user);

        return {
          ...request.toObject(),
          book: book ? {
            title: book.title,
            author: book.author,
            coverImage: book.coverImage,
          } : undefined,
          user: user ? {
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            enrollmentNo: user.enrollmentNo,
          } : undefined
        };
      })
    );

    res.json(enhancedRequests);
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
