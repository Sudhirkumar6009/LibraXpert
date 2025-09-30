const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Notification = require('../models/notification');

// Get all notifications for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      user: req.user.userId
    }).sort({ createdAt: -1 });
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as read and remove it
router.post('/:id/read', auth, async (req, res) => {
  try {
    const notificationId = req.params.id;
    
    // Find the notification
    const notification = await Notification.findById(notificationId);
    
    // Check if notification exists
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check if the notification belongs to the authenticated user
    if (notification.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Delete the notification
    await Notification.findByIdAndDelete(notificationId);
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;