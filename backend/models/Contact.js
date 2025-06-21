const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  timezone: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'slots_generated', 'email_sent', 'scheduled', 'completed'],
    default: 'pending'
  },
  notes: String,
  meetingPreferences: {
    duration: { type: Number, default: 60 },
    timeOfDay: { type: String, enum: ['morning', 'afternoon', 'evening', 'any'], default: 'any' }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound index for user queries
contactSchema.index({ userId: 1, email: 1 }, { unique: true });

const Contact = mongoose.models.Contact || mongoose.model('Contact', contactSchema);

module.exports = Contact;