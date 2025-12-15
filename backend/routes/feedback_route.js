const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Feedback = require('../models/feedback');
const Notification = require('../models/notification');
const User = require('../models/users');

// Submit feedback (public endpoint - no auth required)
router.post('/feedback', async (req, res) => {
  try {
    const { name, email, subject, message, rating } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message || !rating) {
      return res.status(400).json({ 
        message: 'All fields are required (name, email, subject, message, rating)' 
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        message: 'Rating must be between 1 and 5' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Please provide a valid email address' 
      });
    }

    // Create new feedback
    const feedback = new Feedback({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      subject,
      message: message.trim(),
      rating: parseInt(rating)
    });

    // Save to database
    await feedback.save();

    // Create notifications for all admin users
    try {
      // Find all admin users
      const adminUsers = await User.find({ role: 'admin' }, '_id');
      
      // Create notifications for each admin
      const notifications = adminUsers.map(admin => ({
        user: admin._id,
        title: 'New Feedback Received',
        message: `New feedback from ${feedback.name} about ${feedback.subject.replace(/-/g, ' ')} (Rating: ${feedback.rating}/5)`,
        type: 'feedback',
        relatedId: feedback._id,
        actionLink: '/feedback-management'
      }));

      // Save all notifications
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
        console.log(`Created ${notifications.length} notifications for new feedback from ${feedback.name}`);
      }
    } catch (notificationError) {
      // Log error but don't fail the feedback submission
      console.error('Error creating feedback notifications:', notificationError);
    }

    res.status(201).json({ 
      message: 'Feedback submitted successfully',
      feedback: {
        id: feedback._id,
        name: feedback.name,
        subject: feedback.subject,
        rating: feedback.rating,
        createdAt: feedback.createdAt
      }
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error',
        errors: messages 
      });
    }

    res.status(500).json({ message: 'Server error while submitting feedback' });
  }
});

// Get all feedback (admin/librarian only)
router.get('/feedback', auth, async (req, res) => {
  try {
    // Check if user is admin or librarian
    if (req.user.role !== 'admin' && req.user.role !== 'librarian') {
      return res.status(403).json({ 
        message: 'Access denied. Admin or librarian role required.' 
      });
    }

  const { subject, status, sort = '-createdAt', page = 1, limit = 20 } = req.query;
    
    // Build query filter
    const filter = {};
  if (subject) filter.subject = subject;
  if (status) filter.status = status;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get feedback with pagination
    const feedback = await Feedback.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    // Get total count for pagination
    const total = await Feedback.countDocuments(filter);

    res.json({
      feedback,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Server error while fetching feedback' });
  }
});

// Get feedback by ID (admin/librarian only)
router.get('/feedback/:id', auth, async (req, res) => {
  try {
    // Check if user is admin or librarian
    if (req.user.role !== 'admin' && req.user.role !== 'librarian') {
      return res.status(403).json({ 
        message: 'Access denied. Admin or librarian role required.' 
      });
    }

    const feedback = await Feedback.findById(req.params.id).select('-__v');
    
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    res.json(feedback);

  } catch (error) {
    console.error('Error fetching feedback:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid feedback ID' });
    }
    
    res.status(500).json({ message: 'Server error while fetching feedback' });
  }
});

// Update feedback status and add admin notes (admin/librarian only)
router.patch('/feedback/:id', auth, async (req, res) => {
  try {
    // Check if user is admin or librarian
    if (req.user.role !== 'admin' && req.user.role !== 'librarian') {
      return res.status(403).json({ 
        message: 'Access denied. Admin or librarian role required.' 
      });
    }

    const { status, adminNotes } = req.body;
    
    // Validate status if provided
    const validStatuses = ['pending', 'reviewed', 'resolved'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be: pending, reviewed, or resolved' 
      });
    }

    // Build update object
    const updateData = {};
    if (status) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes.trim();

    // Update feedback
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    res.json({
      message: 'Feedback updated successfully',
      feedback
    });

  } catch (error) {
    console.error('Error updating feedback:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid feedback ID' });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error',
        errors: messages 
      });
    }
    
    res.status(500).json({ message: 'Server error while updating feedback' });
  }
});

// Delete feedback (admin only)
router.delete('/feedback/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Admin role required.' 
      });
    }

    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    res.json({ message: 'Feedback deleted successfully' });

  } catch (error) {
    console.error('Error deleting feedback:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid feedback ID' });
    }
    
    res.status(500).json({ message: 'Server error while deleting feedback' });
  }
});

// Get feedback statistics (admin/librarian only)
router.get('/feedback-stats', auth, async (req, res) => {
  try {
    // Check if user is admin or librarian
    if (req.user.role !== 'admin' && req.user.role !== 'librarian') {
      return res.status(403).json({ 
        message: 'Access denied. Admin or librarian role required.' 
      });
    }

    // Get statistics
    const stats = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          totalFeedback: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          reviewedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'reviewed'] }, 1, 0] }
          },
          resolvedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get subject breakdown
    const subjectStats = await Feedback.aggregate([
      {
        $group: {
          _id: '$subject',
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get rating distribution
    const ratingStats = await Feedback.aggregate([
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const result = {
      overall: stats[0] || {
        totalFeedback: 0,
        averageRating: 0,
        pendingCount: 0,
        reviewedCount: 0,
        resolvedCount: 0
      },
      bySubject: subjectStats,
      byRating: ratingStats
    };

    res.json(result);

  } catch (error) {
    console.error('Error fetching feedback statistics:', error);
    res.status(500).json({ message: 'Server error while fetching statistics' });
  }
});

module.exports = router;