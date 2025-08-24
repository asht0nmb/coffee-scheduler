const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const TentativeSlot = require('../models/TentativeSlot');
const Contact = require('../models/Contact');
const SuggestedSlot = require('../models/SuggestedSlot');

/**
 * Pending Events API Routes
 * 
 * Manages confirmed time slots that are blocking future scheduling.
 * These are "pending events" - TentativeSlots that have been confirmed but not yet 
 * turned into actual calendar events.
 * 
 * Integration with existing MongoDB models:
 * - TentativeSlot: Confirmed meeting slots awaiting calendar creation
 * - Contact: Associated contact information
 * - SuggestedSlot: Original suggestions from scheduling algorithm
 */

/**
 * GET /api/pending-events
 * Get all pending events for the authenticated user
 */
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    // Fetch pending TentativeSlots for the user
    const tentativeSlots = await TentativeSlot.find({ 
      userId: req.session.user.id,
      status: 'pending'
    })
    .populate('contactId', 'name email timezone')
    .sort({ createdAt: -1 });

    // Transform to frontend expected format
    const userEvents = tentativeSlots.map(slot => ({
      id: slot._id.toString(),
      sessionId: slot.batchId || 'unknown',
      contactName: slot.contactId?.name || 'Unknown Contact',
      contactEmail: slot.contactEmail,
      timeSlot: slot.displayTimes?.contactTime || `${new Date(slot.timeSlot.start).toLocaleString()}`,
      rawTimeSlot: {
        start: slot.timeSlot.start.toISOString(),
        end: slot.timeSlot.end.toISOString()
      },
      timezone: slot.timeSlot.timezone,
      duration: Math.round((slot.timeSlot.end - slot.timeSlot.start) / (1000 * 60)), // minutes
      createdAt: slot.createdAt.toISOString(),
      status: slot.status,
      userId: slot.userId
    }));
    
    res.json({
      success: true,
      data: userEvents,
      message: `Found ${userEvents.length} pending events`
    });
  } catch (error) {
    console.error('Get pending events error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve pending events',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/pending-events/bulk
 * Create multiple pending events from scheduling selections
 * Creates TentativeSlot entries in MongoDB
 */
router.post('/bulk', ensureAuthenticated, async (req, res) => {
  try {
    const { sessionId, selections } = req.body;
    
    if (!sessionId || !Array.isArray(selections) || selections.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and selections array are required'
      });
    }
    
    const created = [];
    const blocked = [];
    const errors = [];
    
    // Process each selection and create TentativeSlot entries
    for (let i = 0; i < selections.length; i++) {
      const selection = selections[i];
      
      try {
        // Validate required fields
        if (!selection.contactId || !selection.selectedSlot) {
          errors.push(`Selection ${i + 1}: Missing contactId or selectedSlot`);
          continue;
        }

        // Parse time slot data
        const startTime = selection.rawTimeSlot?.start ? 
          new Date(selection.rawTimeSlot.start) : 
          new Date(); // fallback
        const endTime = selection.rawTimeSlot?.end ? 
          new Date(selection.rawTimeSlot.end) : 
          new Date(Date.now() + 60 * 60 * 1000); // 1 hour default

        // Create TentativeSlot entry
        const tentativeSlot = new TentativeSlot({
          userId: req.session.user.id,
          contactId: selection.contactId,
          contactEmail: selection.contactEmail || '',
          timeSlot: {
            start: startTime,
            end: endTime,
            timezone: selection.timezone || 'UTC'
          },
          displayTimes: {
            userTime: selection.userDisplayTime || selection.selectedSlot,
            contactTime: selection.contactDisplayTime || selection.selectedSlot
          },
          status: 'pending',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          addedToGoogleCal: false
        });

        const savedSlot = await tentativeSlot.save();
        
        // Transform to frontend format
        const createdEvent = {
          id: savedSlot._id.toString(),
          sessionId: sessionId,
          contactName: selection.contactName,
          contactEmail: selection.contactEmail,
          timeSlot: selection.selectedSlot,
          rawTimeSlot: {
            start: startTime.toISOString(),
            end: endTime.toISOString()
          },
          timezone: selection.timezone || 'UTC',
          duration: Math.round((endTime - startTime) / (1000 * 60)),
          createdAt: savedSlot.createdAt.toISOString(),
          status: 'pending',
          userId: req.session.user.id
        };

        created.push(createdEvent);
        blocked.push(selection.selectedSlot);
        
        console.log(`✅ Created TentativeSlot for contact ${selection.contactName}`);

      } catch (selectionError) {
        console.error(`Error creating TentativeSlot ${i + 1}:`, selectionError);
        errors.push(`Selection ${i + 1}: ${selectionError.message}`);
      }
    }
    
    console.log(`Bulk create completed: ${created.length} created, ${errors.length} errors for user ${req.session.user.id}`);
    
    const response = {
      success: created.length > 0,
      data: {
        created,
        blocked,
        errors: errors.length > 0 ? errors : undefined
      },
      message: `Created ${created.length} pending events${errors.length > 0 ? ` (${errors.length} errors)` : ''}`
    };

    if (created.length === 0) {
      return res.status(400).json(response);
    }

    res.json(response);
  } catch (error) {
    console.error('Bulk create pending events error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create pending events',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/pending-events/:eventId
 * Clear/cancel a specific pending event (TentativeSlot)
 */
router.delete('/:eventId', ensureAuthenticated, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Validate ObjectId format
    if (!eventId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event ID format'
      });
    }
    
    // Find and update the TentativeSlot status to cancelled
    const tentativeSlot = await TentativeSlot.findOneAndUpdate(
      { 
        _id: eventId, 
        userId: req.session.user.id,
        status: 'pending'
      },
      { 
        status: 'cancelled',
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!tentativeSlot) {
      return res.status(404).json({
        success: false,
        error: 'Pending event not found or already processed'
      });
    }
    
    console.log(`✅ Cancelled pending event ${eventId} for user ${req.session.user.id}`);
    
    res.json({
      success: true,
      message: `Pending event ${eventId} cancelled`,
      data: {
        id: tentativeSlot._id.toString(),
        status: tentativeSlot.status
      }
    });
  } catch (error) {
    console.error('Delete pending event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear pending event',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PATCH /api/pending-events/:eventId/scheduled
 * Mark a pending event as scheduled (converted to calendar event)
 */
router.patch('/:eventId/scheduled', ensureAuthenticated, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { calendarEventId } = req.body;
    
    const eventIndex = pendingEvents.findIndex(event => 
      event.id === eventId && event.userId === req.session.user.id
    );
    
    if (eventIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Pending event not found'
      });
    }
    
    pendingEvents[eventIndex].status = 'scheduled';
    pendingEvents[eventIndex].calendarEventId = calendarEventId;
    pendingEvents[eventIndex].scheduledAt = new Date().toISOString();
    
    console.log(`Marked pending event ${eventId} as scheduled for user ${req.session.user.id}`);
    
    res.json({
      success: true,
      data: pendingEvents[eventIndex]
    });
  } catch (error) {
    console.error('Update pending event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update pending event'
    });
  }
});

/**
 * GET /api/pending-events/blocked-slots
 * Get all blocked time slots from pending events (TentativeSlots)
 */
router.get('/blocked-slots', ensureAuthenticated, async (req, res) => {
  try {
    // Fetch pending TentativeSlots for the user
    const tentativeSlots = await TentativeSlot.find({ 
      userId: req.session.user.id,
      status: 'pending'
    })
    .populate('contactId', 'name')
    .sort({ createdAt: -1 });
    
    const blockedSlots = tentativeSlots.map(slot => ({
      start: slot.timeSlot.start.toISOString(),
      end: slot.timeSlot.end.toISOString(),
      reason: `Blocked by pending event with ${slot.contactId?.name || 'Unknown Contact'}`
    }));
    
    res.json({
      success: true,
      data: blockedSlots,
      message: `Found ${blockedSlots.length} blocked time slots`
    });
  } catch (error) {
    console.error('Get blocked slots error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve blocked slots',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/pending-events/bulk-clear
 * Clear multiple pending events at once (update TentativeSlots to cancelled)
 */
router.post('/bulk-clear', ensureAuthenticated, async (req, res) => {
  try {
    const { eventIds } = req.body;
    
    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'eventIds array is required'
      });
    }

    // Validate all eventIds are valid ObjectIds
    const invalidIds = eventIds.filter(id => !id.match(/^[0-9a-fA-F]{24}$/));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid event ID format: ${invalidIds.join(', ')}`
      });
    }
    
    // Update multiple TentativeSlots to cancelled status
    const result = await TentativeSlot.updateMany(
      { 
        _id: { $in: eventIds },
        userId: req.session.user.id,
        status: 'pending'
      },
      { 
        status: 'cancelled',
        updatedAt: new Date()
      }
    );
    
    const clearedCount = result.modifiedCount;
    
    console.log(`✅ Cancelled ${clearedCount} pending events for user ${req.session.user.id}`);
    
    res.json({
      success: true,
      message: `Cancelled ${clearedCount} pending events`,
      data: {
        requestedCount: eventIds.length,
        clearedCount: clearedCount,
        notFoundCount: eventIds.length - clearedCount
      }
    });
  } catch (error) {
    console.error('Bulk clear pending events error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear pending events'
    });
  }
});

/**
 * POST /api/pending-events/cleanup
 * Clean up expired pending events (update expired TentativeSlots)
 */
router.post('/cleanup', ensureAuthenticated, async (req, res) => {
  try {
    const { olderThan } = req.body;
    const cutoffDate = new Date(olderThan || Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago by default
    
    // Count current pending events before cleanup
    const beforeCount = await TentativeSlot.countDocuments({
      userId: req.session.user.id,
      status: 'pending'
    });
    
    // Update expired TentativeSlots to 'expired' status
    // Either by expiresAt date or by creation date cutoff
    const result = await TentativeSlot.updateMany(
      {
        userId: req.session.user.id,
        status: 'pending',
        $or: [
          { expiresAt: { $lt: new Date() } }, // Naturally expired
          { createdAt: { $lt: cutoffDate } }  // User-requested cutoff
        ]
      },
      { 
        status: 'expired',
        updatedAt: new Date()
      }
    );
    
    const clearedCount = result.modifiedCount;
    
    // Count remaining pending events after cleanup
    const remainingCount = await TentativeSlot.countDocuments({
      userId: req.session.user.id,
      status: 'pending'
    });
    
    console.log(`✅ Cleaned up ${clearedCount} expired pending events for user ${req.session.user.id}`);
    
    res.json({
      success: true,
      data: {
        clearedCount,
        remainingCount,
        beforeCount,
        cutoffDate: cutoffDate.toISOString()
      },
      message: `Cleaned up ${clearedCount} expired events, ${remainingCount} remaining`
    });
  } catch (error) {
    console.error('Cleanup pending events error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup pending events',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/pending-events/check-conflict
 * Check if a time slot conflicts with pending events (TentativeSlots)
 */
router.post('/check-conflict', ensureAuthenticated, async (req, res) => {
  try {
    const { timeSlot } = req.body;
    
    if (!timeSlot || !timeSlot.start || !timeSlot.end) {
      return res.status(400).json({
        success: false,
        error: 'timeSlot with start and end is required'
      });
    }

    const slotStart = new Date(timeSlot.start);
    const slotEnd = new Date(timeSlot.end);
    
    // Find TentativeSlots that overlap with the requested time slot
    const conflictingSlots = await TentativeSlot.find({
      userId: req.session.user.id,
      status: 'pending',
      // MongoDB query for time overlap: slot.start < requestEnd && slot.end > requestStart
      $and: [
        { 'timeSlot.start': { $lt: slotEnd } },
        { 'timeSlot.end': { $gt: slotStart } }
      ]
    })
    .populate('contactId', 'name email')
    .sort({ 'timeSlot.start': 1 });
    
    const conflicts = conflictingSlots.map(slot => ({
      id: slot._id.toString(),
      contactName: slot.contactId?.name || 'Unknown Contact',
      contactEmail: slot.contactEmail,
      timeSlot: slot.displayTimes?.contactTime || `${slot.timeSlot.start.toLocaleString()} - ${slot.timeSlot.end.toLocaleString()}`,
      rawTimeSlot: {
        start: slot.timeSlot.start.toISOString(),
        end: slot.timeSlot.end.toISOString()
      }
    }));
    
    res.json({
      success: true,
      data: {
        hasConflict: conflicts.length > 0,
        conflictCount: conflicts.length,
        conflicts: conflicts,
        requestedSlot: {
          start: slotStart.toISOString(),
          end: slotEnd.toISOString()
        }
      },
      message: conflicts.length > 0 
        ? `Found ${conflicts.length} conflicting pending events`
        : 'No conflicts found'
    });
  } catch (error) {
    console.error('Check conflict error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check conflicts',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/pending-events/stats
 * Get statistics about pending events (TentativeSlots)
 */
router.get('/stats', ensureAuthenticated, async (req, res) => {
  try {
    // Use MongoDB aggregation for efficient stats calculation
    const statsAggregation = await TentativeSlot.aggregate([
      {
        $match: { userId: req.session.user.id }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert aggregation result to object
    const statusCounts = {};
    statsAggregation.forEach(item => {
      statusCounts[item._id] = item.count;
    });

    // Calculate this week's events
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thisWeekCount = await TentativeSlot.countDocuments({
      userId: req.session.user.id,
      createdAt: { $gte: weekAgo }
    });

    const stats = {
      total: (statusCounts.pending || 0) + (statusCounts.confirmed || 0) + (statusCounts.expired || 0) + (statusCounts.cancelled || 0),
      pending: statusCounts.pending || 0,
      confirmed: statusCounts.confirmed || 0,
      expired: statusCounts.expired || 0,
      cancelled: statusCounts.cancelled || 0,
      thisWeek: thisWeekCount
    };
    
    res.json({
      success: true,
      data: stats,
      message: `Found ${stats.total} total pending events, ${stats.pending} currently pending`
    });
  } catch (error) {
    console.error('Get pending events stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve stats',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    service: 'pending-events',
    status: 'healthy',
    message: 'Pending events service is operational',
    inMemoryEvents: pendingEvents.length,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;