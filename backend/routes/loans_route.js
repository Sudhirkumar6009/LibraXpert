const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const BorrowRequest = require('../models/borrowRequest');
const Book = require('../models/books');
const User = require('../models/users');
const Notification = require('../models/notification');

const MAX_RENEWALS = 2;
const RENEWAL_EXTENSION_DAYS = 30;

const isLibrarian = (role) => ['librarian', 'admin'].includes(role);

const buildLoanResponse = (request, userId) => {
  const book = request.book && request.book._id ? request.book : null;
  const bookId = book ? book._id : request.book;
  const resolvedUserId = userId || (request.user && request.user._id ? request.user._id : request.user);

  let status = 'active';
  if (request.returned) {
    status = 'returned';
  } else if (request.dueDate && new Date(request.dueDate) < new Date()) {
    status = 'overdue';
  }

  return {
    id: request._id,
    bookId,
    userId: resolvedUserId,
    bookTitle: book ? book.title : 'Unknown Book',
    bookAuthor: book ? book.author || 'Unknown Author' : 'Unknown Author',
    coverImage: book && book.coverImage ? book.coverImage : null,
    borrowDate: request.approvedAt || request.requestedAt,
    dueDate: request.dueDate,
    returnDate: request.returnedAt,
    status,
    renewalStatus: request.renewalStatus || 'none',
    renewalRequestedAt: request.renewalRequestedAt,
    renewalDecisionAt: request.renewalDecisionAt,
    renewalCount: request.renewalCount || 0,
  };
};

const getPersonDisplayName = (userDoc) => {
  if (!userDoc) return 'A borrower';
  if (userDoc.firstName || userDoc.lastName) {
    return [userDoc.firstName, userDoc.lastName].filter(Boolean).join(' ').trim();
  }
  return userDoc.username || userDoc.email || 'A borrower';
};

// Get all loans for the current user
router.get('/loans/my-loans', auth, async (req, res) => {
  try {
    const borrowRequests = await BorrowRequest.find({
      user: req.user.userId,
      status: 'approved',
    })
      .populate('book')
      .sort({ approvedAt: -1 });

    if (!borrowRequests || borrowRequests.length === 0) {
      return res.json([]);
    }

    const loans = borrowRequests.map((request) => buildLoanResponse(request, req.user.userId));
    res.json(loans);
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(500).json({ message: 'Server error while fetching loans' });
  }
});

// Request a renewal (student)
router.post('/loans/:id/request-renewal', auth, async (req, res) => {
  try {
    const loanId = req.params.id;
    const { note } = req.body || {};

    const borrowRequest = await BorrowRequest.findById(loanId).populate('book').populate('user');

    if (!borrowRequest) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    if (String(borrowRequest.user._id || borrowRequest.user) !== String(req.user.userId)) {
      return res.status(403).json({ message: 'Not authorized to renew this loan' });
    }

    if (borrowRequest.returned) {
      return res.status(400).json({ message: 'Cannot renew a returned loan' });
    }

    if (borrowRequest.status !== 'approved') {
      return res.status(400).json({ message: 'Only active loans can be renewed' });
    }

    if (borrowRequest.renewalStatus === 'pending') {
      return res.status(400).json({ message: 'Renewal request is already pending' });
    }

    if ((borrowRequest.renewalCount || 0) >= MAX_RENEWALS) {
      return res.status(400).json({ message: `Maximum renewals (${MAX_RENEWALS}) reached` });
    }

    borrowRequest.renewalStatus = 'pending';
    borrowRequest.renewalRequestedAt = new Date();
    borrowRequest.renewalDecisionAt = undefined;
    borrowRequest.renewalDecisionBy = undefined;
    borrowRequest.renewalNotes = note || undefined;

    await borrowRequest.save();

    await borrowRequest.populate('book');
    await borrowRequest.populate('user');

    await Notification.deleteMany({ relatedId: borrowRequest._id, type: 'loan_renewal_request' });

    const librarians = await User.find({ role: { $in: ['librarian', 'admin'] } }).select('_id');
    if (librarians.length > 0) {
      const borrowerName = getPersonDisplayName(borrowRequest.user);
      const bookTitle = borrowRequest.book ? borrowRequest.book.title : 'a book';

      const notifications = librarians.map((librarian) => ({
        user: librarian._id,
        title: 'Loan renewal requested',
        message: `${borrowerName} requested to renew "${bookTitle}"`,
        type: 'loan_renewal_request',
        relatedId: borrowRequest._id,
        actionLink: '/management/loans',
      }));

      await Notification.insertMany(notifications);
    }

    res.json(buildLoanResponse(borrowRequest, req.user.userId));
  } catch (error) {
    console.error('Error requesting renewal:', error);
    res.status(500).json({ message: 'Server error while requesting renewal' });
  }
});

// Get pending renewals for librarians
router.get('/loans/pending-renewals', auth, async (req, res) => {
  try {
    if (!isLibrarian(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const pendingRenewals = await BorrowRequest.find({
      renewalStatus: 'pending',
      status: 'approved',
      returned: false,
    })
      .populate('book')
      .populate('user')
      .sort({ renewalRequestedAt: 1 });

    const response = pendingRenewals.map((request) => ({
      id: request._id,
      bookId: request.book && request.book._id ? request.book._id : request.book,
      bookTitle: request.book ? request.book.title : 'Unknown Book',
      bookAuthor: request.book ? request.book.author || 'Unknown Author' : 'Unknown Author',
      coverImage: request.book && request.book.coverImage ? request.book.coverImage : null,
      borrowerId: request.user && request.user._id ? request.user._id : request.user,
      borrowerName: getPersonDisplayName(request.user),
      borrowerEmail: request.user ? request.user.email : undefined,
      borrowDate: request.approvedAt || request.requestedAt,
      dueDate: request.dueDate,
      renewalRequestedAt: request.renewalRequestedAt,
      renewalCount: request.renewalCount || 0,
    }));

    res.json(response);
  } catch (error) {
    console.error('Error fetching pending renewals:', error);
    res.status(500).json({ message: 'Server error while fetching renewals' });
  }
});

// Approve a renewal (librarian)
router.post('/loans/:id/renew', auth, async (req, res) => {
  try {
    if (!isLibrarian(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const loanId = req.params.id;
    const borrowRequest = await BorrowRequest.findById(loanId).populate('book').populate('user');

    if (!borrowRequest) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    if (borrowRequest.returned) {
      return res.status(400).json({ message: 'Cannot renew a returned loan' });
    }

    if (borrowRequest.renewalStatus !== 'pending') {
      return res.status(400).json({ message: 'No pending renewal request to approve' });
    }

    if ((borrowRequest.renewalCount || 0) >= MAX_RENEWALS) {
      return res.status(400).json({ message: `Maximum renewals (${MAX_RENEWALS}) reached` });
    }

    const baseDueDate = borrowRequest.dueDate ? new Date(borrowRequest.dueDate) : new Date();
    baseDueDate.setDate(baseDueDate.getDate() + RENEWAL_EXTENSION_DAYS);

    borrowRequest.dueDate = baseDueDate;
    borrowRequest.renewalCount = (borrowRequest.renewalCount || 0) + 1;
    borrowRequest.lastRenewedAt = new Date();
    borrowRequest.renewalStatus = 'approved';
    borrowRequest.renewalDecisionBy = req.user.userId;
    borrowRequest.renewalDecisionAt = new Date();

    await borrowRequest.save();

    await Notification.deleteMany({ relatedId: borrowRequest._id, type: 'loan_renewal_request' });

    const borrowerId = borrowRequest.user && borrowRequest.user._id ? borrowRequest.user._id : borrowRequest.user;
    if (borrowerId) {
      const bookTitle = borrowRequest.book ? borrowRequest.book.title : 'your book';
      await Notification.create({
        user: borrowerId,
        title: 'Loan renewal approved',
        message: `Your renewal request for "${bookTitle}" was approved. New due date: ${baseDueDate.toLocaleDateString()}.`,
        type: 'loan_renewal_decision',
        relatedId: borrowRequest._id,
        actionLink: '/loans',
      });
    }

    res.json(buildLoanResponse(borrowRequest, borrowerId));
  } catch (error) {
    console.error('Error approving renewal:', error);
    res.status(500).json({ message: 'Server error while approving renewal' });
  }
});

// Decline a renewal (librarian)
router.post('/loans/:id/renew/decline', auth, async (req, res) => {
  try {
    if (!isLibrarian(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const loanId = req.params.id;
    const { reason } = req.body || {};

    const borrowRequest = await BorrowRequest.findById(loanId).populate('book').populate('user');

    if (!borrowRequest) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    if (borrowRequest.renewalStatus !== 'pending') {
      return res.status(400).json({ message: 'No pending renewal request to decline' });
    }

    borrowRequest.renewalStatus = 'declined';
    borrowRequest.renewalDecisionBy = req.user.userId;
    borrowRequest.renewalDecisionAt = new Date();
    borrowRequest.renewalNotes = reason || undefined;

    await borrowRequest.save();

    await Notification.deleteMany({ relatedId: borrowRequest._id, type: 'loan_renewal_request' });

    const borrowerId = borrowRequest.user && borrowRequest.user._id ? borrowRequest.user._id : borrowRequest.user;
    if (borrowerId) {
      const bookTitle = borrowRequest.book ? borrowRequest.book.title : 'your book';
      const message = reason
        ? `Your renewal request for "${bookTitle}" was declined. Reason: ${reason}`
        : `Your renewal request for "${bookTitle}" was declined.`;
      await Notification.create({
        user: borrowerId,
        title: 'Loan renewal declined',
        message,
        type: 'loan_renewal_decision',
        relatedId: borrowRequest._id,
        actionLink: '/loans',
      });
    }

    res.json(buildLoanResponse(borrowRequest, borrowerId));
  } catch (error) {
    console.error('Error declining renewal:', error);
    res.status(500).json({ message: 'Server error while declining renewal' });
  }
});

module.exports = router;