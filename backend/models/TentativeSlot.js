const mongoose = require('mongoose');

const tentativeSlotSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
  contactEmail: { type: String, required: true },
  timeSlot: {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    timezone: { type: String, required: true }
  },
  displayTimes: {
    userTime: String,    // "Wed, Jun 12 at 9:00 AM PST"
    contactTime: String  // "Wed, Jun 12 at 12:00 PM EST"
  },
  addedToGoogleCal: { type: Boolean, default: false },
  googleCalEventId: String,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'expired', 'cancelled'],
    default: 'pending'
  },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Index for efficient queries
tentativeSlotSchema.index({ userId: 1, expiresAt: 1 });
tentativeSlotSchema.index({ contactEmail: 1, status: 1 });

const TentativeSlot = mongoose.models.TentativeSlot || mongoose.model('TentativeSlot', tentativeSlotSchema);

module.exports = TentativeSlot;