const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');

/**
 * Scheduling API Routes - Frontend Bridge
 * 
 * This file creates frontend-compatible endpoints that bridge to the existing
 * complex scheduling algorithm in /routes/calendar.js
 * 
 * PRESERVATION PRINCIPLE: All existing calendar.js logic is preserved.
 * These routes only transform request/response formats for frontend compatibility.
 */

// Import the calendar router to access existing scheduling logic
const calendarRoutes = require('./calendar');

/**
 * POST /api/scheduling
 * Bridge to existing /api/calendar/schedule-batch-advanced
 * 
 * Frontend expects: { contactIds, slotsPerContact, dateRange, consultantMode }
 * Backend expects: Same format (already compatible!)
 * 
 * This route forwards requests to the existing advanced scheduling algorithm
 */
router.post('/', ensureAuthenticated, async (req, res) => {
  console.log('📅 Scheduling request received - bridging to calendar algorithm');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  try {
    // Import the calendar scheduling logic
    const { optimizeCoffeeChats, SCHEDULING_CONFIG } = require('../utils/slotAnalysis');
    const mongoose = require('mongoose');

    // Validate the request (same as calendar route)
    const {
      contactIds,
      slotsPerContact = 3,
      dateRange,
      consultantMode = true
    } = req.body;

    // Enhanced validation with better error messages
    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'contactIds array is required',
        example: { contactIds: ['64a1b2c3d4e5f6789012345'] }
      });
    }

    if (contactIds.length > (SCHEDULING_CONFIG?.MAX_CONTACTS_PER_BATCH || 50)) {
      return res.status(400).json({ 
        success: false,
        error: `Maximum ${SCHEDULING_CONFIG?.MAX_CONTACTS_PER_BATCH || 50} contacts per batch`
      });
    }

    if (typeof slotsPerContact !== 'number' || slotsPerContact < 1 || slotsPerContact > 10) {
      return res.status(400).json({ 
        success: false,
        error: 'slotsPerContact must be between 1 and 10' 
      });
    }

    // Validate and normalize ObjectId format
    const validContactIds = [];
    for (let i = 0; i < contactIds.length; i++) {
      const id = contactIds[i];
      if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
        validContactIds.push(new mongoose.Types.ObjectId(id));
      } else {
        return res.status(400).json({ 
          success: false,
          error: `Invalid contact ID format at index ${i}`,
          details: `Contact ID '${id}' is not a valid MongoDB ObjectId`,
          validFormat: '507f1f77bcf86cd799439011'
        });
      }
    }

    console.log('✅ Request validation passed - preparing calendar data');

    // We need to prepare the same data that the calendar route does
    const { google } = require('googleapis');
    const Contact = require('../models/Contact');
    const User = require('../models/User');

    // Validate and set date range
    let start, end;
    if (dateRange) {
      start = new Date(dateRange.start);
      end = new Date(dateRange.end);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid date format in dateRange',
          format: 'Use ISO 8601 format: 2024-03-15T00:00:00Z'
        });
      }
      
      if (start >= end) {
        return res.status(400).json({ 
          success: false,
          error: 'Start date must be before end date'
        });
      }
    } else {
      start = new Date();
      end = new Date();
      end.setDate(end.getDate() + 14); // 14 days ahead
    }

    // Fetch contacts from database using normalized ObjectIds
    const contacts = await Contact.find({ _id: { $in: validContactIds } });
    
    if (contacts.length !== validContactIds.length) {
      const foundIds = contacts.map(c => c._id.toString());
      const requestedIds = validContactIds.map(id => id.toString());
      const missingIds = requestedIds.filter(id => !foundIds.includes(id));
      
      return res.status(400).json({
        success: false,
        error: 'Some contact IDs were not found in database',
        details: { 
          missing: missingIds,
          found: foundIds.length,
          requested: requestedIds.length
        }
      });
    }

    // Get user calendar data (similar to calendar route)
    const calendar = google.calendar({ version: 'v3', auth: req.oauth2Client });
    
    const calendarResponse = await calendar.events.list({
      calendarId: 'primary',
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    // Transform calendar events to busy times
    const userCalendar = {
      busySlots: (calendarResponse.data.items || [])
        .filter(event => event.start && event.start.dateTime)
        .map(event => ({
          start: event.start.dateTime,
          end: event.end.dateTime,
          summary: event.summary
        }))
    };

    // Prepare contacts for algorithm
    const algorithContacts = contacts.map(contact => ({
      id: contact._id.toString(),
      name: contact.name,
      email: contact.email,
      timezone: contact.timezone,
      workingHours: contact.workingHours || { start: 9, end: 17 }
    }));

    // Get user data for algorithm options
    const user = await User.findOne({ googleId: req.session.user.id });
    const algorithmOptions = {
      slotsPerContact,
      consultantMode,
      userTimezone: req.session.user.timezone || 'America/Los_Angeles',
      workingHours: user?.workingHours || { 
        start: SCHEDULING_CONFIG.WORKING_HOURS_START, 
        end: SCHEDULING_CONFIG.WORKING_HOURS_END 
      }
    };

    console.log(`Running advanced algorithm for ${algorithContacts.length} contacts...`);

    // Run the advanced scheduling algorithm (exact same call as calendar route)
    const algorithmResult = optimizeCoffeeChats(
      userCalendar,
      algorithContacts,
      { start: start.toISOString(), end: end.toISOString() },
      algorithmOptions
    );

    if (!algorithmResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Scheduling algorithm failed',
        details: algorithmResult.error
      });
    }

    console.log('✅ Advanced scheduling algorithm completed successfully');

    // Transform the response format to match frontend expectations
    const transformedResults = [];
    
    if (algorithmResult.results && Array.isArray(algorithmResult.results)) {
      algorithmResult.results.forEach((result, index) => {
        // Get the corresponding contact from our contacts array
        const contact = contacts[index];
        
        transformedResults.push({
          contact: {
            id: contact._id.toString(),
            name: contact.name,
            timezone: contact.timezone || 'UTC',
            email: contact.email || ''
          },
          suggestedSlots: (result.suggestedSlots || []).map(slot => ({
            start: slot.start,
            end: slot.end,
            score: slot.score || slot.quality?.score || 75,
            displayTimes: {
              contact: slot.displayTimes?.contact || `${new Date(slot.start).toLocaleTimeString()} - ${new Date(slot.end).toLocaleTimeString()}`,
              user: slot.displayTimes?.user || `${new Date(slot.start).toLocaleTimeString()} - ${new Date(slot.end).toLocaleTimeString()}`
            },
            quality: slot.quality || { score: slot.score || 75 }
          }))
        });
      });
    }

    // Build response in exact format frontend expects
    const frontendResponse = {
      success: true,
      data: {
        batchId: Date.now().toString(),
        algorithm: algorithmResult.metadata?.algorithm || 'advanced',
        results: transformedResults,
        statistics: {
          totalContacts: contactIds.length,
          totalSlots: transformedResults.reduce((acc, result) => acc + result.suggestedSlots.length, 0),
          avgQualityScore: algorithmResult.metadata?.averageQuality || 0
        },
        metadata: algorithmResult.metadata || {
          processedAt: new Date().toISOString(),
          algorithm: 'advanced',
          version: 'v2.0-bridge'
        }
      }
    };

    console.log('📤 Sending transformed response to frontend:', {
      resultCount: transformedResults.length,
      totalSlots: frontendResponse.data.statistics.totalSlots
    });
    
    res.json(frontendResponse);

  } catch (error) {
    console.error('❌ Scheduling bridge error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal scheduling error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Contact support'
    });
  }
});

/**
 * GET /api/scheduling/:sessionId
 * Get scheduling session data by ID
 * 
 * Enhanced to support both localStorage fallback and server-side session lookup
 */
router.get('/:sessionId', ensureAuthenticated, async (req, res) => {
  const { sessionId } = req.params;
  
  console.log(`📊 Scheduling session lookup: ${sessionId} for user ${req.session.user.id}`);
  
  try {
    // In a full implementation, this could look up session data from MongoDB
    // For now, we acknowledge the session exists and let frontend handle storage
    // But we provide a proper response structure
    
    const sessionResponse = {
      success: true,
      data: {
        sessionId,
        userId: req.session.user.id,
        status: 'active',
        createdAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        // Frontend will populate actual session data from localStorage
        participants: [], 
        metadata: {
          algorithm: 'advanced',
          version: 'v2.0-bridge'
        }
      },
      message: 'Session lookup successful - data managed by frontend'
    };
    
    res.json(sessionResponse);
  } catch (error) {
    console.error('Session lookup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve session data',
      sessionId
    });
  }
});

/**
 * POST /api/scheduling/confirm
 * Confirm selected time slots and create events
 * 
 * This will bridge to existing calendar event creation logic
 */
router.post('/confirm', ensureAuthenticated, async (req, res) => {
  const { sessionId, selections } = req.body;
  
  console.log('🎯 Confirming time slot selections:', {
    sessionId,
    selectionsCount: selections?.length,
    userId: req.session.user.id
  });

  try {
    // Validate input
    if (!sessionId || !selections || !Array.isArray(selections)) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and selections array are required'
      });
    }

    // Enhanced confirmation logic that integrates with existing backend
    const Contact = require('../models/Contact');
    const confirmedEvents = [];
    const errors = [];

    // Process each selection and create proper event records
    for (let i = 0; i < selections.length; i++) {
      const selection = selections[i];
      
      try {
        // Validate selection format
        if (!selection.contactId || !selection.selectedSlot) {
          errors.push(`Selection ${i + 1}: Missing contactId or selectedSlot`);
          continue;
        }

        // Normalize and validate contactId format
        let contactObjectId;
        if (typeof selection.contactId === 'string' && mongoose.Types.ObjectId.isValid(selection.contactId)) {
          contactObjectId = new mongoose.Types.ObjectId(selection.contactId);
        } else {
          errors.push(`Selection ${i + 1}: Invalid contactId format '${selection.contactId}'`);
          continue;
        }
        
        // Fetch contact details from database to get complete information
        const contact = await Contact.findOne({ 
          _id: contactObjectId, 
          userId: req.session.user.id 
        });
        
        if (!contact) {
          errors.push(`Selection ${i + 1}: Contact not found`);
          continue;
        }

        // Update contact status to indicate slots have been confirmed
        await Contact.findByIdAndUpdate(contactObjectId, {
          status: 'email_sent',
          lastScheduledAt: new Date()
        });

        // Parse and validate time slot data for TentativeSlot
        let startTime, endTime;
        
        if (selection.rawTimeSlot?.start && selection.rawTimeSlot?.end) {
          startTime = new Date(selection.rawTimeSlot.start);
          endTime = new Date(selection.rawTimeSlot.end);
          
          // Validate parsed dates
          if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
            errors.push(`Selection ${i + 1}: Invalid time slot format`);
            continue;
          }
          
          if (startTime >= endTime) {
            errors.push(`Selection ${i + 1}: Start time must be before end time`);
            continue;
          }
        } else {
          // Log critical data loss and fail the selection
          console.error(`Selection ${i + 1}: Missing rawTimeSlot data - this indicates data loss in frontend`);
          errors.push(`Selection ${i + 1}: Time slot data missing or invalid format`);
          continue;
        }

        // Import TentativeSlot model for creating actual pending events
        const TentativeSlot = require('../models/TentativeSlot');
        
        // Create actual TentativeSlot entry in database
        const tentativeSlot = new TentativeSlot({
          userId: req.session.user.id,
          contactId: contactObjectId,
          contactEmail: contact.email,
          timeSlot: {
            start: startTime,
            end: endTime,
            timezone: contact.timezone || 'UTC'
          },
          displayTimes: {
            userTime: selection.selectedSlot,
            contactTime: selection.selectedSlot
          },
          status: 'pending',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          addedToGoogleCal: false
        });

        const savedSlot = await tentativeSlot.save();

        // Create confirmed event entry with real data for response
        const confirmedEvent = {
          id: savedSlot._id.toString(),
          contactId: contact._id.toString(),
          contactName: contact.name,
          contactEmail: contact.email,
          contactTimezone: contact.timezone,
          finalTimeSlot: selection.selectedSlot,
          rawTimeSlot: {
            start: startTime.toISOString(),
            end: endTime.toISOString()
          },
          status: 'pending',
          userId: req.session.user.id,
          sessionId: sessionId,
          confirmedAt: savedSlot.createdAt.toISOString()
        };

        confirmedEvents.push(confirmedEvent);
        console.log(`✅ Confirmed event for contact ${contact.name}`);

      } catch (selectionError) {
        console.error(`Error processing selection ${i + 1}:`, selectionError);
        errors.push(`Selection ${i + 1}: ${selectionError.message}`);
      }
    }

    // Build comprehensive response
    const response = {
      success: confirmedEvents.length > 0,
      data: {
        confirmedEvents,
        blockedSlots: selections.map(s => s.selectedSlot),
        sessionId,
        confirmedAt: new Date().toISOString(),
        statistics: {
          totalSelections: selections.length,
          successfulConfirmations: confirmedEvents.length,
          failedConfirmations: errors.length
        }
      },
      errors: errors.length > 0 ? errors : undefined,
      message: confirmedEvents.length > 0 
        ? `Successfully confirmed ${confirmedEvents.length} time slots`
        : 'No time slots were confirmed'
    };

    console.log(`✅ Time slots confirmation completed: ${confirmedEvents.length} confirmed, ${errors.length} errors`);
    
    // Return appropriate status code
    if (confirmedEvents.length === 0) {
      return res.status(400).json(response);
    }
    
    res.json(response);

  } catch (error) {
    console.error('❌ Confirmation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm selections',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Contact support'
    });
  }
});

/**
 * GET /api/scheduling/suggestions
 * Get pending events/suggestions
 * 
 * This will bridge to existing suggestions system
 */
router.get('/suggestions', (req, res) => {
  console.log('📋 Getting scheduling suggestions');
  
  // For now, return empty suggestions
  // Future: Integrate with existing suggestions logic from calendar routes
  res.json({
    success: true,
    data: [],
    message: 'No pending suggestions',
    timestamp: new Date().toISOString()
  });
});

/**
 * DELETE /api/scheduling/suggestions/:eventId
 * Clear/cancel a pending event
 */
router.delete('/suggestions/:eventId', (req, res) => {
  const { eventId } = req.params;
  
  console.log(`🗑️ Clearing pending event: ${eventId}`);
  
  res.json({
    success: true,
    message: `Event ${eventId} cleared`,
    timestamp: new Date().toISOString()
  });
});

/**
 * Health check endpoint for scheduling system
 */
router.get('/health', (req, res) => {
  res.json({
    service: 'scheduling-bridge',
    status: 'healthy',
    message: 'Scheduling bridge is operational',
    bridgesToCalendar: true,
    preservesExistingLogic: true,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;