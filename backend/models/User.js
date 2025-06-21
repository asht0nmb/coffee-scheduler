const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: String,
  picture: String,
  timezone: { type: String, default: 'America/Los_Angeles' },
  workingHours: {
    start: { type: Number, default: 9 },  // 9 AM
    end: { type: Number, default: 17 }    // 5 PM
  },
  preferences: {
    meetingDuration: { type: Number, default: 60 }, // minutes
    bufferTime: { type: Number, default: 15 }       // minutes between meetings
  },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;