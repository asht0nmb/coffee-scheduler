const express = require('express');
const { google } = require('googleapis');
const mongoose = require('mongoose');
const moment = require('moment-timezone');
const { 
  generateAvailableSlots, 
  calculateSlotQuality, 
  selectOptimalSlots,
  calculateStandardDeviation 
} = require('../utils/slotAnalysis');
const { 
  formatTimeForTimezone,
  groupSlotsByDay,
  selectOptimalDistribution,
  generateRecommendations
} = require('../utils/timeUtils');

const router = express.Router();

// Import models
const User = mongoose.models.User || require('../models/User');
const Contact = mongoose.models.Contact || require('../models/Contact');
const SuggestedSlot = mongoose.models.SuggestedSlot || require('../models/SuggestedSlot');

// Test calendar access
router.get('/test', async (req, res) => {
  try {
    const calendar = google.calendar({ version: 'v3', auth: req.oauth2Client });
    
    const response = await calendar.calendarList.list();
    
    res.json({
      message: 'Calendar access successful!',
      calendars: response.data.items.map(cal => ({
        id: cal.id,
        summary: cal.summary,
        primary: cal.primary,
        accessRole: cal.accessRole
      }))
    });
  } catch (error) {
    console.error('Calendar test error:', error);
    res.status(500).json({ 
      error: 'Calendar access failed',
      details: error.message 
    });
  }
});

// Get calendar events for a date range
router.get('/events', async (req, res) => {
  try {
    const { timeMin, timeMax, calendarId = 'primary' } = req.query;
    
    if (!timeMin || !timeMax) {
      return res.status(400).json({ 
        error: 'timeMin and timeMax query parameters are required' 
      });
    }

    const calendar = google.calendar({ version: 'v3', auth: req.oauth2Client });
    
    const response = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100
    });
    
    res.json({
      events: response.data.items,
      nextSyncToken: response.data.nextSyncToken
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ 
      error: 'Failed to get calendar events',
      details: error.message 
    });
  }
});

// Get raw calendar availability (free/busy times only)
router.get('/raw-availability', async (req, res) => {
  try {
    const { 
      startDate, 
      endDate,
      timeZone = 'UTC' // Default to UTC for consistent calculations
    } = req.query;

    // Validation
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate and endDate are required',
        example: '/api/calendar/raw-availability?startDate=2025-06-12&endDate=2025-06-19',
        format: 'Use YYYY-MM-DD format'
      });
    }

    // Parse and validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ 
        error: 'Invalid date format. Use YYYY-MM-DD' 
      });
    }

    if (start >= end) {
      return res.status(400).json({ 
        error: 'startDate must be before endDate' 
      });
    }

    // Convert to ISO strings for Google API
    const timeMin = start.toISOString();
    const timeMax = end.toISOString();

    console.log(`Fetching raw availability: ${timeMin} to ${timeMax}`);

    const calendar = google.calendar({ version: 'v3', auth: req.oauth2Client });

    // Use Google's freebusy API - designed exactly for this purpose
    const freeBusyResponse = await calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        timeZone,
        items: [{ id: 'primary' }] // Primary calendar only for now
      }
    });

    // Extract busy times
    const busyTimes = freeBusyResponse.data.calendars.primary.busy || [];
    
    // Calculate some basic stats
    const totalBusyMinutes = busyTimes.reduce((total, busy) => {
      const duration = new Date(busy.end) - new Date(busy.start);
      return total + (duration / (1000 * 60)); // Convert to minutes
    }, 0);

    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    // Return clean, raw data
    res.json({
      success: true,
      dateRange: {
        start: timeMin,
        end: timeMax,
        totalDays,
        timeZone
      },
      busyTimes: busyTimes.map(busy => ({
        start: busy.start,
        end: busy.end,
        duration: Math.round((new Date(busy.end) - new Date(busy.start)) / (1000 * 60)) // minutes
      })),
      summary: {
        totalBusySlots: busyTimes.length,
        totalBusyMinutes: Math.round(totalBusyMinutes),
        totalBusyHours: Math.round(totalBusyMinutes / 60 * 10) / 10, // Round to 1 decimal
        averageBusyPerDay: Math.round(totalBusyMinutes / totalDays)
      },
      metadata: {
        fetchedAt: new Date().toISOString(),
        userId: req.session.user.id,
        calendarId: 'primary'
      }
    });

  } catch (error) {
    console.error('Raw availability error:', error);
    
    // Handle specific Google API errors
    if (error.code === 403) {
      return res.status(403).json({ 
        error: 'Calendar access denied. Please re-authenticate.',
        suggestion: 'Visit /api/auth/google to re-authorize'
      });
    }

    if (error.code === 401) {
      return res.status(401).json({ 
        error: 'Authentication expired',
        suggestion: 'Visit /api/auth/google to re-authenticate'
      });
    }

    res.status(500).json({ 
      error: 'Failed to fetch calendar availability',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Analyze slots for optimal scheduling
router.post('/analyze-slots', async (req, res) => {
  try {
    const {
      rawAvailability,    // From our raw-availability endpoint
      contactTimezone,    // Contact's timezone
      workingHours = { start: 9, end: 17.5 }, // 9am-5:30pm default
      timePreferences = ['morning', 'afternoon'], // Preferred times
      meetingDuration = 60, // Minutes
      daysToGenerate = 5   // Number of days to look ahead
    } = req.body;

    // Validation
    if (!rawAvailability || !contactTimezone) {
      return res.status(400).json({
        error: 'rawAvailability and contactTimezone are required',
        example: {
          rawAvailability: { busyTimes: [], dateRange: {} },
          contactTimezone: 'America/New_York',
          workingHours: { start: 9, end: 17.5 }
        }
      });
    }

    console.log(`Analyzing slots for contact in ${contactTimezone}`);

    // Generate available slots in contact's timezone
    const availableSlots = generateAvailableSlots(
      rawAvailability.busyTimes,
      rawAvailability.dateRange,
      contactTimezone,
      workingHours,
      meetingDuration,
      daysToGenerate
    );

    // Score each slot for quality
    const scoredSlots = availableSlots.map(slot => ({
      ...slot,
      quality: calculateSlotQuality(slot, timePreferences),
      // Add display times for both user and contact
      displayTimes: {
        contact: formatTimeForTimezone(slot.start, contactTimezone),
        user: formatTimeForTimezone(slot.start, req.session.user.timezone || 'America/Los_Angeles')
      }
    }));

    // Sort by quality score (highest first) and limit to best options
    const rankedSlots = scoredSlots
      .sort((a, b) => b.quality.score - a.quality.score)
      .slice(0, 12); // Top 12 slots

    // Group by day for better presentation
    const slotsByDay = groupSlotsByDay(rankedSlots);

    // Select optimal distribution (morning, afternoon, different days)
    const optimalSlots = selectOptimalDistribution(rankedSlots, 3);

    res.json({
      success: true,
      analysis: {
        contactTimezone,
        workingHours,
        meetingDuration,
        totalSlotsFound: availableSlots.length,
        avgQualityScore: Math.round(
          scoredSlots.reduce((sum, slot) => sum + slot.quality.score, 0) / scoredSlots.length
        )
      },
      optimalSlots: optimalSlots,
      allSlots: rankedSlots,
      slotsByDay: slotsByDay,
      recommendations: generateRecommendations(scoredSlots, timePreferences),
      metadata: {
        analyzedAt: new Date().toISOString(),
        userId: req.session.user.id,
        algorithm: 'v1.0'
      }
    });

  } catch (error) {
    console.error('Slot analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze slots',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Endpoint for batch scheduling
router.post('/schedule-batch', async (req, res) => {
  try {
    const {
      contactIds,
      slotsPerContact = 3,
      dateRange,
      consultantMode = true
    } = req.body;

    // Comprehensive validation
    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'contactIds array is required' });
    }

    if (contactIds.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 contacts per batch' });
    }

    if (typeof slotsPerContact !== 'number' || slotsPerContact < 1 || slotsPerContact > 10) {
      return res.status(400).json({ error: 'slotsPerContact must be between 1 and 10' });
    }

    // Validate ObjectId format
    if (!contactIds.every(id => mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ error: 'Invalid contact ID format' });
    }

    // Validate date range
    if (dateRange) {
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid date format in dateRange' });
      }
      
      if (start >= end) {
        return res.status(400).json({ error: 'Start date must be before end date' });
      }
      
      const maxRange = 30 * 24 * 60 * 60 * 1000; // 30 days
      if (end - start > maxRange) {
        return res.status(400).json({ error: 'Date range cannot exceed 30 days' });
      }
      
      // Prevent scheduling too far in the past
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (start < oneDayAgo) {
        return res.status(400).json({ error: 'Start date cannot be in the past' });
      }
    }

    // Fetch contacts
    const contacts = await Contact.find({
      _id: { $in: contactIds },
      userId: req.session.user.id
    });

    if (contacts.length !== contactIds.length) {
      return res.status(404).json({ error: 'Some contacts not found' });
    }

    // Get user's availability
    const userTimezone = req.session.user.timezone || 'America/Los_Angeles';
    const start = dateRange?.start || new Date().toISOString();
    const end = dateRange?.end || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch calendar busy times
    const calendar = google.calendar({ version: 'v3', auth: req.oauth2Client });
    const freeBusyResponse = await calendar.freebusy.query({
      requestBody: {
        timeMin: start,
        timeMax: end,
        timeZone: 'UTC',
        items: [{ id: 'primary' }]
      }
    });

    const busyTimes = freeBusyResponse.data.calendars.primary.busy || [];

    // Use MongoDB transaction to prevent race conditions
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get active suggested slots within transaction
      const existingSuggestions = await SuggestedSlot.find({
        userId: req.session.user.id,
        status: 'active'
      }).session(session);

      // Filter out expired slots and extract active ones
      const now = new Date();
      const activeSuggestedSlots = [];

      for (const suggestion of existingSuggestions) {
        const activeSlots = suggestion.slots.filter(slot => slot.expiresAt > now);
        activeSuggestedSlots.push(...activeSlots.map(slot => ({
          start: slot.start.toISOString(),
          end: slot.end.toISOString()
        })));
      }

      // Combine busy times with active suggested slots
      const allBusyTimes = [...busyTimes, ...activeSuggestedSlots];

      // Track scores across all contacts for fairness
      const allContactScores = [];
      const batchId = `batch_${new Date().getTime()}`;
      const batchResults = [];

      // PERFORMANCE FIX: Fetch user's working hours ONCE outside the loop
      // Previous: 50+ queries for 50 contacts (N+1 pattern)
      // Current: 1 query total (98% reduction)
      const user = await User.findOne({ googleId: req.session.user.id });
      const userWorkingHours = user?.workingHours || { start: 9, end: 17 };

      // First pass: generate and score all possible slots for each contact
      const contactSlotOptions = [];
      
      for (const contact of contacts) {
        // Use cached userWorkingHours (no database query in loop)

        const availableSlots = generateAvailableSlots(
          allBusyTimes,
          { start, end },
          contact.timezone,
          userWorkingHours,
          contact.meetingPreferences?.duration || 60,
          14
        );

        const contactPreferences = contact.meetingPreferences?.timeOfDay ? 
          [contact.meetingPreferences.timeOfDay] : 
          ['morning', 'afternoon'];

        const scoredSlots = availableSlots.map(slot => ({
          ...slot,
          quality: calculateSlotQuality(slot, contactPreferences, { consultantMode })
        }));

        scoredSlots.sort((a, b) => b.quality.score - a.quality.score);
        
        contactSlotOptions.push({
          contact,
          availableSlots: scoredSlots
        });
      }

      // Calculate global target score for fairness
      const allScores = contactSlotOptions.flatMap(({ availableSlots }) => 
        availableSlots.slice(0, slotsPerContact * 2).map(s => s.quality.score)
      );
      const globalTargetScore = allScores.length > 0 ? 
        allScores.reduce((a, b) => a + b, 0) / allScores.length : 
        70;

      // Collect all suggestions for bulk insert
      const suggestionsToInsert = [];

      // Second pass: select slots using global target score
      for (const { contact, availableSlots } of contactSlotOptions) {
        // Use global target score for fairness
        const targetScore = globalTargetScore;

        // Select diverse slots near target score
        const selectedSlots = selectOptimalSlots(availableSlots, slotsPerContact, targetScore, allBusyTimes);

        // Track scores for fairness calculation
        const contactScores = selectedSlots.map(s => s.quality.score);
        allContactScores.push({
          contactId: contact._id,
          scores: contactScores,
          average: contactScores.reduce((a, b) => a + b, 0) / contactScores.length
        });

        // Add selected slots to busy times
        selectedSlots.forEach(slot => {
          allBusyTimes.push({
            start: slot.start,
            end: slot.end
          });
        });

        // Prepare suggestion for bulk insert
        suggestionsToInsert.push({
          userId: req.session.user.id,
          contactId: contact._id,
          contactEmail: contact.email,
          batchId,
          slots: selectedSlots.map(slot => ({
            start: new Date(slot.start),
            end: new Date(slot.end),
            score: slot.quality.score,
            expiresAt: new Date(new Date(slot.start).getTime() - 24 * 60 * 60 * 1000)
          }))
        });

        // Cache timezone objects for better performance (if needed later)

        batchResults.push({
          contact: {
            id: contact._id,
            name: contact.name,
            email: contact.email,
            timezone: contact.timezone
          },
          suggestedSlots: selectedSlots.map(slot => {
            const slotMoment = moment.utc(slot.start);
            return {
              ...slot,
              displayTimes: {
                contact: slotMoment.tz(contact.timezone).format('ddd, MMM D [at] h:mm A z'),
                user: slotMoment.tz(userTimezone).format('ddd, MMM D [at] h:mm A z')
              },
              expiresAt: new Date(new Date(slot.start).getTime() - 24 * 60 * 60 * 1000)
            };
          }),
          averageScore: Math.round(
            contactScores.reduce((a, b) => a + b, 0) / contactScores.length
          )
        });
      }

      // Bulk insert all suggestions within transaction
      await SuggestedSlot.insertMany(suggestionsToInsert, { session });

      // Commit transaction
      await session.commitTransaction();

      // Calculate fairness metrics
      const finalAllScores = allContactScores.flatMap(c => c.scores);
      const avgScore = finalAllScores.reduce((a, b) => a + b, 0) / finalAllScores.length;
      const scoreStdDev = calculateStandardDeviation(finalAllScores);
      
      // Calculate per-contact average standard deviation
      const contactAverages = allContactScores.map(c => c.average);
      const contactAvgStdDev = calculateStandardDeviation(contactAverages);

      res.json({
        success: true,
        batchId,
        results: batchResults,
        statistics: {
          totalContacts: contacts.length,
          totalSlots: batchResults.reduce((sum, r) => sum + r.suggestedSlots.length, 0),
          averageScore: Math.round(avgScore),
          scoreStandardDeviation: Math.round(scoreStdDev),
          fairnessScore: Math.round(100 - contactAvgStdDev), // Based on consistency of averages
          consultantMode
        },
        metadata: {
          createdAt: new Date().toISOString()
        }
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }

  } catch (error) {
    console.error('Batch scheduling error:', error);
    res.status(500).json({
      error: 'Failed to schedule batch',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Add endpoint to clear suggested slots
router.post('/clear-suggestions', async (req, res) => {
  try {
    const { batchId, contactId } = req.body;

    const filter = { userId: req.session.user.id };
    if (batchId) filter.batchId = batchId;
    if (contactId) filter.contactId = contactId;

    const result = await SuggestedSlot.updateMany(
      filter,
      { status: 'cleared' }
    );

    res.json({
      success: true,
      cleared: result.modifiedCount,
      message: `Cleared ${result.modifiedCount} suggestion(s)`
    });

  } catch (error) {
    console.error('Clear suggestions error:', error);
    res.status(500).json({ error: 'Failed to clear suggestions' });
  }
});

// Add endpoint to view current suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const { batchId, includeExpired = false } = req.query;
    
    const filter = { 
      userId: req.session.user.id,
      status: includeExpired ? { $in: ['active', 'expired'] } : 'active'
    };
    
    if (batchId) filter.batchId = batchId;
    
    const suggestions = await SuggestedSlot.find(filter)
      .populate('contactId', 'name email timezone')
      .sort({ createdAt: -1 });
    
    // Filter out individually expired slots
    const now = new Date();
    const processedSuggestions = suggestions.map(suggestion => {
      const activeSlots = suggestion.slots.filter(slot => 
        includeExpired || slot.expiresAt > now
      );
      
      return {
        id: suggestion._id,
        batchId: suggestion.batchId,
        contact: suggestion.contactId,
        slots: activeSlots.map(slot => ({
          start: slot.start,
          end: slot.end,
          score: slot.score,
          expiresAt: slot.expiresAt,
          isExpired: slot.expiresAt <= now,
          displayTimes: {
            contact: moment.utc(slot.start).tz(suggestion.contactId.timezone)
              .format('ddd, MMM D [at] h:mm A z'),
            user: moment.utc(slot.start).tz(req.session.user.timezone || 'America/Los_Angeles')
              .format('ddd, MMM D [at] h:mm A z')
          }
        })),
        status: suggestion.status,
        createdAt: suggestion.createdAt
      };
    }).filter(s => s.slots.length > 0); // Only show suggestions with slots
    
    res.json({
      suggestions: processedSuggestions,
      summary: {
        totalBatches: [...new Set(processedSuggestions.map(s => s.batchId))].length,
        totalContacts: processedSuggestions.length,
        totalActiveSlots: processedSuggestions.reduce((sum, s) => 
          sum + s.slots.filter(slot => !slot.isExpired).length, 0
        )
      }
    });
    
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// Add webhook or periodic job to detect scheduled meetings
router.post('/sync-scheduled', async (req, res) => {
  try {
    // Get recent calendar events
    const calendar = google.calendar({ version: 'v3', auth: req.oauth2Client });
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const events = await calendar.events.list({
      calendarId: 'primary',
      timeMin: oneWeekAgo.toISOString(),
      timeMax: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      singleEvents: true
    });
    
    // Extract email addresses from events
    const scheduledEmails = new Set();
    events.data.items?.forEach(event => {
      event.attendees?.forEach(attendee => {
        if (attendee.email) {
          scheduledEmails.add(attendee.email.toLowerCase());
        }
      });
    });
    
    // Update suggestions for scheduled contacts
    const updatedCount = await SuggestedSlot.updateMany(
      {
        userId: req.session.user.id,
        contactEmail: { $in: Array.from(scheduledEmails) },
        status: 'active'
      },
      {
        status: 'meeting_scheduled'
      }
    );
    
    res.json({
      success: true,
      scheduledEmails: Array.from(scheduledEmails),
      updatedSuggestions: updatedCount.modifiedCount
    });
    
  } catch (error) {
    console.error('Sync scheduled error:', error);
    res.status(500).json({ error: 'Failed to sync scheduled meetings' });
  }
});

// Add a periodic cleanup (can be called via cron job)
router.post('/cleanup-expired', async (_req, res) => {
  try {
    // Update suggestions with all expired slots to 'expired' status
    const now = new Date();
    
    const suggestions = await SuggestedSlot.find({
      status: 'active',
      'slots.expiresAt': { $lt: now }
    });
    
    let updatedCount = 0;
    for (const suggestion of suggestions) {
      const hasActiveSlots = suggestion.slots.some(slot => slot.expiresAt > now);
      
      if (!hasActiveSlots) {
        // All slots expired, mark entire suggestion as expired
        suggestion.status = 'expired';
        await suggestion.save();
        updatedCount++;
      }
    }
    
    res.json({
      success: true,
      processed: suggestions.length,
      expired: updatedCount
    });
    
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: 'Failed to cleanup expired slots' });
  }
});

module.exports = router;