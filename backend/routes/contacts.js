const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const TentativeSlot = require('../models/TentativeSlot');
const { ensureAuthenticated } = require('../middleware/auth');
const { validateContactData } = require('../middleware/validation');
const { contactRateLimit } = require('../middleware/rateLimiting');

// Get all contacts for user
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const contacts = await Contact.find({ userId: req.session.user.id })
      .sort({ updatedAt: -1 });

    res.json(contacts);
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Failed to retrieve contacts' });
  }
});

// Add new contact
router.post('/', ensureAuthenticated, contactRateLimit, validateContactData, async (req, res) => {
  console.log('👥 Contact Creation Request:', {
    body: req.body,
    userId: req.session?.user?.id,
    userEmail: req.session?.user?.email,
    sessionId: req.sessionID,
    timestamp: new Date().toISOString()
  });
  
  const { name, email, timezone, notes, meetingPreferences } = req.body;

  // Validation
  if (!name || !email || !timezone) {
    console.log('❌ Contact validation failed - missing required fields:', {
      hasName: !!name,
      hasEmail: !!email,
      hasTimezone: !!timezone
    });
    return res.status(400).json({ 
      error: 'Name, email, and timezone are required' 
    });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.log('❌ Invalid email format:', email);
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    
    console.log('🔍 Checking for existing contact:', {
      userId: req.session.user.id,
      email: normalizedEmail
    });
    
    // Check if contact already exists
    const existingContact = await Contact.findOne({
      userId: req.session.user.id,
      email: normalizedEmail
    });

    if (existingContact) {
      console.log('⚠️ Contact already exists:', {
        existingContactId: existingContact._id,
        existingName: existingContact.name,
        existingStatus: existingContact.status,
        createdAt: existingContact.createdAt
      });
      
      // Return the existing contact instead of error for better UX
      return res.status(200).json({
        message: 'Contact already exists, returning existing contact',
        contact: existingContact,
        wasExisting: true
      });
    }

    console.log('✨ Creating new contact:', {
      name: name.trim(),
      email: normalizedEmail,
      timezone,
      userId: req.session.user.id
    });
    
    const contact = new Contact({
      userId: req.session.user.id,
      name: name.trim(),
      email: normalizedEmail,
      timezone,
      notes: notes || '',
      meetingPreferences: meetingPreferences || {
        duration: 30,
        timeOfDay: 'any'
      },
      status: 'pending'
    });

    const savedContact = await contact.save();
    console.log('✅ Contact created successfully:', {
      id: savedContact._id,
      name: savedContact.name,
      email: savedContact.email,
      status: savedContact.status
    });
    
    res.status(201).json(savedContact);
  } catch (error) {
    console.error('❌ Create contact error:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      requestBody: req.body,
      userId: req.session?.user?.id
    });
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(409).json({ 
        error: 'Contact with this email already exists',
        details: 'Duplicate key error'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create contact',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update contact
router.put('/:id', ensureAuthenticated, contactRateLimit, async (req, res) => {
  try {
    const allowedUpdates = ['name', 'email', 'timezone', 'status', 'notes', 'meetingPreferences'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    updates.updatedAt = new Date();

    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, userId: req.session.user.id },
      updates,
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    console.log('Contact updated:', contact.email);
    res.json(contact);
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// Delete contact
router.delete('/:id', ensureAuthenticated, contactRateLimit, async (req, res) => {
  try {
    const contact = await Contact.findOneAndDelete({
      _id: req.params.id,
      userId: req.session.user.id
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Also delete associated tentative slots
    await TentativeSlot.deleteMany({
      userId: req.session.user.id,
      contactId: req.params.id
    });

    console.log('Contact deleted:', contact.email);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// Get contact statistics
router.get('/stats', ensureAuthenticated, async (req, res) => {
  try {
    const stats = await Contact.aggregate([
      { $match: { userId: req.session.user.id } },
      { 
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalContacts = await Contact.countDocuments({ userId: req.session.user.id });

    const formattedStats = {
      total: totalContacts,
      pending: 0,
      slotsGenerated: 0,
      emailSent: 0,
      scheduled: 0,
      completed: 0
    };

    stats.forEach(stat => {
      if (stat._id === 'pending') formattedStats.pending = stat.count;
      if (stat._id === 'slots_generated') formattedStats.slotsGenerated = stat.count;
      if (stat._id === 'email_sent') formattedStats.emailSent = stat.count;
      if (stat._id === 'scheduled') formattedStats.scheduled = stat.count;
      if (stat._id === 'completed') formattedStats.completed = stat.count;
    });

    res.json(formattedStats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

module.exports = router;