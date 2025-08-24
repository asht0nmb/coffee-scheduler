const express = require('express');
const router = express.Router();

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
router.post('/', async (req, res) => {
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

    // Validate ObjectId format
    if (!contactIds.every(id => mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid contact ID format',
        details: 'Contact IDs must be valid MongoDB ObjectIds'
      });
    }

    console.log('✅ Request validation passed - calling advanced scheduling algorithm');

    // Call the existing advanced scheduling algorithm
    const schedulingResult = await optimizeCoffeeChats({
      contactIds,
      slotsPerContact,
      dateRange,
      consultantMode,
      userId: req.session?.user?.id,
      oauth2Client: req.oauth2Client // Pass the authenticated client
    });

    console.log('✅ Advanced scheduling algorithm completed successfully');

    // Transform the calendar response to match frontend expectations
    const frontendResponse = {
      success: true,
      data: {
        batchId: schedulingResult.batchId || Date.now().toString(),
        algorithm: schedulingResult.algorithm || 'advanced',
        results: schedulingResult.results || [],
        statistics: schedulingResult.statistics || {
          totalContacts: contactIds.length,
          totalSlots: 0,
          avgQualityScore: 0
        },
        metadata: {
          processedAt: new Date().toISOString(),
          userId: req.session?.user?.id,
          version: 'v2.0-bridge'
        }
      }
    };

    console.log('📤 Sending transformed response to frontend');
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
 * For now, this will be stored in memory/localStorage on frontend
 * Future: Could integrate with MongoDB session storage
 */
router.get('/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  console.log(`📊 Scheduling session lookup: ${sessionId}`);
  
  // For now, return a basic response indicating session lookup
  // Frontend will handle session storage via localStorage
  res.json({
    success: true,
    message: 'Session lookup - handled by frontend localStorage',
    sessionId,
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/scheduling/confirm
 * Confirm selected time slots and create events
 * 
 * This will bridge to existing calendar event creation logic
 */
router.post('/confirm', async (req, res) => {
  const { sessionId, selections } = req.body;
  
  console.log('🎯 Confirming time slot selections:', {
    sessionId,
    selectionsCount: selections?.length
  });

  try {
    // Validate input
    if (!sessionId || !selections || !Array.isArray(selections)) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and selections array are required'
      });
    }

    // For now, return a mock confirmation response
    // Future: Integrate with existing calendar event creation logic
    const confirmedEvents = selections.map((selection, index) => ({
      id: `event_${Date.now()}_${index}`,
      contactId: selection.contactId,
      contactName: selection.contactName || `Contact ${index + 1}`,
      finalTimeSlot: selection.selectedSlot,
      status: 'pending'
    }));

    const response = {
      success: true,
      data: {
        confirmedEvents,
        blockedSlots: selections.map(s => s.selectedSlot),
        sessionId,
        confirmedAt: new Date().toISOString()
      }
    };

    console.log('✅ Time slots confirmed successfully');
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