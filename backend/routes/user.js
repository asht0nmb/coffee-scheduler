const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { ensureAuthenticated } = require('../middleware/auth');

// Get user profile
router.get('/profile', ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findOne({ googleId: req.session.user.id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user preferences
router.put('/preferences', ensureAuthenticated, async (req, res) => {
  try {
    const { timezone, workingHours, preferences } = req.body;
    
    const updates = {};
    if (timezone) updates.timezone = timezone;
    if (workingHours) updates.workingHours = workingHours;
    if (preferences) updates.preferences = preferences;
    
    const user = await User.findOneAndUpdate(
      { googleId: req.session.user.id },
      updates,
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update session
    if (timezone) req.session.user.timezone = timezone;
    
    res.json(user);
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

module.exports = router;