const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: String,
  picture: String,
  timezone: { type: String, default: 'America/Los_Angeles' },
  workingHours: {
    start: { type: String, default: '09:00' },  // 9:00 AM in HH:MM format
    end: { type: String, default: '17:00' }     // 5:00 PM in HH:MM format
  },
  preferences: {
    // Meeting preferences
    defaultDuration: { type: Number, default: 60 }, // minutes
    weekendAvailability: { type: Boolean, default: false },
    emailNotifications: { type: Boolean, default: true },
    reminderTime: { type: Number, default: 15 }, // minutes before meeting
    
    // Legacy fields (kept for compatibility)
    meetingDuration: { type: Number, default: 60 },
    bufferTime: { type: Number, default: 15 }
  },
  // Account settings
  account: {
    loginNotifications: { type: Boolean, default: true }
  },
  // Advanced settings
  advanced: {
    syncFrequency: { 
      type: String, 
      enum: ['realtime', 'hourly', 'daily'], 
      default: 'hourly' 
    },
    dataRetention: { type: Number, default: 365 }, // days (-1 for forever)
    analyticsEnabled: { type: Boolean, default: true },
    betaFeatures: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
  lastCalendarSync: { type: Date, default: null },
  lastCleanup: { type: Date, default: null }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;