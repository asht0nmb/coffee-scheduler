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
    if (!process.env.MONGO_URL) {
      return res.json([
        { 
          id: '1', 
          name: 'Sarah Chen', 
          email: 'sarah@example.com', 
          timezone: 'America/New_York', 
          status: 'pending',
          createdAt: new Date()
        },
        { 
          id: '2', 
          name: 'Marcus Johnson', 
          email: 'marcus@example.com', 
          timezone: 'Europe/London', 
          status: 'slots_generated',
          createdAt: new Date()
        }
      ]);
    }

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
  const { name, email, timezone, notes, meetingPreferences } = req.body;

  // Validation
  if (!name || !email || !timezone) {
    return res.status(400).json({ 
      error: 'Name, email, and timezone are required' 
    });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    if (!process.env.MONGO_URL) {
      return res.json({
        id: Date.now().toString(),
        userId: req.session.user.id,
        name,
        email,
        timezone,
        status: 'pending',
        notes: notes || '',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Check if contact already exists
    const existingContact = await Contact.findOne({
      userId: req.session.user.id,
      email: email.toLowerCase()
    });

    if (existingContact) {
      return res.status(409).json({ 
        error: 'Contact with this email already exists' 
      });
    }

    const contact = new Contact({
      userId: req.session.user.id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      timezone,
      notes: notes || '',
      meetingPreferences: meetingPreferences || {},
      status: 'pending'
    });

    const savedContact = await contact.save();
    console.log('Contact created:', savedContact.email);
    
    res.status(201).json(savedContact);
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ error: 'Failed to create contact' });
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

    if (!process.env.MONGO_URL) {
      return res.json({ 
        id: req.params.id, 
        ...updates, 
        message: 'Contact updated (mock)' 
      });
    }

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
    if (!process.env.MONGO_URL) {
      return res.json({ success: true, message: 'Contact deleted (mock)' });
    }

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
    if (!process.env.MONGO_URL) {
      return res.json({
        total: 2,
        pending: 1,
        slotsGenerated: 1,
        emailSent: 0,
        scheduled: 0,
        completed: 0
      });
    }

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