const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { ensureAuthenticated } = require('../middleware/auth');
const CleanupService = require('../services/cleanupService');
const SyncService = require('../services/syncService');

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

// Get user preferences (for settings page)
router.get('/preferences', ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findOne({ googleId: req.session.user.id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Transform to frontend settings format
    const settings = {
      account: {
        name: user.name,
        email: user.email,
        loginNotifications: user.account?.loginNotifications ?? true
      },
      preferences: {
        timezone: user.timezone,
        defaultDuration: user.preferences?.defaultDuration ?? 60,
        workingHours: {
          start: user.workingHours?.start ?? '09:00',
          end: user.workingHours?.end ?? '17:00'
        },
        emailNotifications: user.preferences?.emailNotifications ?? true,
        reminderTime: user.preferences?.reminderTime ?? 15,
        weekendAvailability: user.preferences?.weekendAvailability ?? false
      },
      advanced: {
        syncFrequency: user.advanced?.syncFrequency ?? 'hourly',
        dataRetention: user.advanced?.dataRetention ?? 365,
        analyticsEnabled: user.advanced?.analyticsEnabled ?? true,
        betaFeatures: user.advanced?.betaFeatures ?? false
      }
    };
    
    res.json(settings);
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// Update user preferences (enhanced for all settings)
router.put('/preferences', ensureAuthenticated, async (req, res) => {
  try {
    const { account, preferences, advanced } = req.body;
    
    const updates = {};
    
    // Account settings (read-only fields excluded)
    if (account?.loginNotifications !== undefined) {
      updates['account.loginNotifications'] = account.loginNotifications;
    }
    
    // Preferences settings
    if (preferences?.timezone) {
      updates.timezone = preferences.timezone;
    }
    if (preferences?.defaultDuration) {
      updates['preferences.defaultDuration'] = preferences.defaultDuration;
      // Update legacy field for compatibility
      updates['preferences.meetingDuration'] = preferences.defaultDuration;
    }
    if (preferences?.workingHours) {
      updates.workingHours = preferences.workingHours;
    }
    if (preferences?.emailNotifications !== undefined) {
      updates['preferences.emailNotifications'] = preferences.emailNotifications;
    }
    if (preferences?.reminderTime !== undefined) {
      updates['preferences.reminderTime'] = preferences.reminderTime;
    }
    if (preferences?.weekendAvailability !== undefined) {
      updates['preferences.weekendAvailability'] = preferences.weekendAvailability;
    }
    
    // Advanced settings
    if (advanced?.syncFrequency) {
      updates['advanced.syncFrequency'] = advanced.syncFrequency;
    }
    if (advanced?.dataRetention !== undefined) {
      updates['advanced.dataRetention'] = advanced.dataRetention;
    }
    if (advanced?.analyticsEnabled !== undefined) {
      updates['advanced.analyticsEnabled'] = advanced.analyticsEnabled;
    }
    if (advanced?.betaFeatures !== undefined) {
      updates['advanced.betaFeatures'] = advanced.betaFeatures;
    }
    
    console.log('📝 Updating user settings:', {
      userId: req.session.user.id,
      updates: Object.keys(updates)
    });
    
    const user = await User.findOneAndUpdate(
      { googleId: req.session.user.id },
      updates,
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update session timezone if changed
    if (preferences?.timezone) {
      req.session.user.timezone = preferences.timezone;
    }
    
    console.log('✅ User settings updated successfully');
    
    // Return the updated settings in the same format as GET
    const updatedSettings = {
      account: {
        name: user.name,
        email: user.email,
        loginNotifications: user.account?.loginNotifications ?? true
      },
      preferences: {
        timezone: user.timezone,
        defaultDuration: user.preferences?.defaultDuration ?? 60,
        workingHours: {
          start: user.workingHours?.start ?? '09:00',
          end: user.workingHours?.end ?? '17:00'
        },
        emailNotifications: user.preferences?.emailNotifications ?? true,
        reminderTime: user.preferences?.reminderTime ?? 15,
        weekendAvailability: user.preferences?.weekendAvailability ?? false
      },
      advanced: {
        syncFrequency: user.advanced?.syncFrequency ?? 'hourly',
        dataRetention: user.advanced?.dataRetention ?? 365,
        analyticsEnabled: user.advanced?.analyticsEnabled ?? true,
        betaFeatures: user.advanced?.betaFeatures ?? false
      }
    };
    
    res.json(updatedSettings);
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Trigger cleanup for current user
router.post('/cleanup', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const user = await User.findOne({ googleId: userId });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const dataRetention = user.advanced?.dataRetention || 365;
    const result = await CleanupService.runCleanupForUser(userId, dataRetention);
    
    // Update last cleanup time
    await User.findOneAndUpdate(
      { googleId: userId },
      { lastCleanup: new Date() }
    );
    
    res.json({
      success: true,
      result,
      message: `Cleaned up ${result.cleanedSlots} old items`
    });
    
  } catch (error) {
    console.error('Manual cleanup error:', error);
    res.status(500).json({ error: 'Failed to run cleanup' });
  }
});

// Get cleanup status for current user
router.get('/cleanup-status', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const stats = await CleanupService.getCleanupStats(userId);
    
    const user = await User.findOne({ googleId: userId });
    const lastCleanup = user?.lastCleanup;
    
    res.json({
      ...stats,
      lastCleanup: lastCleanup?.toISOString() || null
    });
    
  } catch (error) {
    console.error('Get cleanup status error:', error);
    res.status(500).json({ error: 'Failed to get cleanup status' });
  }
});

// Trigger calendar sync for current user
router.post('/sync-calendar', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    if (!req.oauth2Client) {
      return res.status(401).json({ error: 'Calendar access not available' });
    }
    
    const syncResult = await SyncService.syncConfirmedSlotsToCalendar(
      userId, 
      req.oauth2Client
    );
    
    res.json({
      success: true,
      result: syncResult
    });
    
  } catch (error) {
    console.error('Manual sync error:', error);
    res.status(500).json({ error: 'Failed to sync calendar' });
  }
});

// Get sync status for current user
router.get('/sync-status', ensureAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const status = await SyncService.getSyncStatus(userId);
    
    res.json(status);
    
  } catch (error) {
    console.error('Get sync status error:', error);
    res.status(500).json({ error: 'Failed to get sync status' });
  }
});

module.exports = router;