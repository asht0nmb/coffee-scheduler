const mongoose = require('mongoose');

const suggestedSlotSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
  contactEmail: { type: String, required: true }, // For matching when meeting scheduled
  batchId: { type: String, required: true },
  slots: [{
    start: Date,
    end: Date,
    score: Number,
    selected: { type: Boolean, default: false },
    // Individual slot expiry (24hrs before slot time)
    expiresAt: { type: Date, required: true }
  }],
  status: {
    type: String,
    enum: ['active', 'expired', 'meeting_scheduled', 'cleared'],
    default: 'active'
  },
  createdAt: { type: Date, default: Date.now }
});

// Indexes for efficient queries
suggestedSlotSchema.index({ userId: 1, status: 1 });
suggestedSlotSchema.index({ contactEmail: 1, status: 1 });
suggestedSlotSchema.index({ 'slots.expiresAt': 1 });

const SuggestedSlot = mongoose.models.SuggestedSlot || mongoose.model('SuggestedSlot', suggestedSlotSchema);

module.exports = SuggestedSlot;