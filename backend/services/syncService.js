const { google } = require('googleapis');
const User = require('../models/User');
const TentativeSlot = require('../models/TentativeSlot');

/**
 * Settings-driven sync service that respects user sync frequency preferences
 */
class SyncService {
  
  /**
   * Add confirmed TentativeSlots to user's Google Calendar
   */
  static async syncConfirmedSlotsToCalendar(userId, oauth2Client) {
    console.log(`📅 Syncing confirmed slots to calendar for user ${userId}`);
    
    try {
      // Get user's sync preferences
      const user = await User.findOne({ googleId: userId });
      const syncFrequency = user?.advanced?.syncFrequency || 'hourly';
      
      console.log(`⚙️ User sync frequency: ${syncFrequency}`);
      
      // Check if sync is needed based on frequency
      const lastSync = user?.lastCalendarSync || new Date(0);
      const now = new Date();
      const timeSinceLastSync = now - lastSync;
      
      let syncIntervalMs;
      switch (syncFrequency) {
        case 'realtime':
          syncIntervalMs = 0; // Always sync
          break;
        case 'hourly':
          syncIntervalMs = 60 * 60 * 1000; // 1 hour
          break;
        case 'daily':
          syncIntervalMs = 24 * 60 * 60 * 1000; // 24 hours
          break;
        default:
          syncIntervalMs = 60 * 60 * 1000; // Default to hourly
      }
      
      if (timeSinceLastSync < syncIntervalMs && syncFrequency !== 'realtime') {
        console.log(`⏭️ Sync not needed yet. Next sync in ${Math.round((syncIntervalMs - timeSinceLastSync) / 1000 / 60)} minutes`);
        return {
          synced: false,
          reason: 'sync_frequency_not_met',
          nextSyncIn: syncIntervalMs - timeSinceLastSync
        };
      }
      
      // Get confirmed slots that haven't been added to calendar yet
      const unsynced = await TentativeSlot.find({
        userId: userId,
        status: 'confirmed',
        addedToGoogleCal: { $ne: true },
        'timeSlot.start': { $gt: new Date() } // Only future events
      }).populate('contactId', 'name email');
      
      console.log(`📋 Found ${unsynced.length} unsynced confirmed slots`);
      
      if (unsynced.length === 0) {
        // Update last sync time even if no events to sync
        await User.findOneAndUpdate(
          { googleId: userId },
          { lastCalendarSync: now }
        );
        
        return {
          synced: true,
          eventsAdded: 0,
          message: 'No events to sync'
        };
      }
      
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const results = {
        synced: true,
        eventsAdded: 0,
        errors: []
      };
      
      // Add each confirmed slot to Google Calendar
      for (const slot of unsynced) {
        try {
          const event = {
            summary: `Coffee Chat with ${slot.contactId?.name || slot.contactEmail}`,
            description: `Scheduled coffee chat meeting\nContact: ${slot.contactEmail}\nDuration: ${Math.round((slot.timeSlot.end - slot.timeSlot.start) / (1000 * 60))} minutes`,
            start: {
              dateTime: slot.timeSlot.start.toISOString(),
              timeZone: slot.timeSlot.timezone
            },
            end: {
              dateTime: slot.timeSlot.end.toISOString(),
              timeZone: slot.timeSlot.timezone
            },
            attendees: [
              { email: slot.contactEmail }
            ],
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'email', minutes: user?.preferences?.reminderTime || 15 },
                { method: 'popup', minutes: 10 }
              ]
            }
          };
          
          const calendarEvent = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
            sendUpdates: user?.preferences?.emailNotifications ? 'all' : 'none'
          });
          
          // Update the slot to mark it as added to calendar
          await TentativeSlot.findByIdAndUpdate(slot._id, {
            addedToGoogleCal: true,
            googleCalEventId: calendarEvent.data.id
          });
          
          results.eventsAdded++;
          console.log(`✅ Added event to calendar: ${event.summary}`);
          
        } catch (error) {
          console.error(`❌ Failed to add event for ${slot.contactEmail}:`, error.message);
          results.errors.push({
            slotId: slot._id,
            contactEmail: slot.contactEmail,
            error: error.message
          });
        }
      }
      
      // Update last sync time
      await User.findOneAndUpdate(
        { googleId: userId },
        { lastCalendarSync: now }
      );
      
      console.log(`🎉 Sync completed: ${results.eventsAdded} events added, ${results.errors.length} errors`);
      return results;
      
    } catch (error) {
      console.error('❌ Calendar sync failed:', error);
      throw error;
    }
  }
  
  /**
   * Check for events that were scheduled externally and update TentativeSlot status
   */
  static async syncScheduledEventsFromCalendar(userId, oauth2Client) {
    console.log(`🔄 Checking for externally scheduled events for user ${userId}`);
    
    try {
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      // Get recent calendar events
      const events = await calendar.events.list({
        calendarId: 'primary',
        timeMin: oneWeekAgo.toISOString(),
        timeMax: oneMonthFromNow.toISOString(),
        singleEvents: true
      });
      
      // Extract attendee emails from calendar events
      const scheduledEmails = new Set();
      events.data.items?.forEach(event => {
        event.attendees?.forEach(attendee => {
          if (attendee.email && attendee.responseStatus === 'accepted') {
            scheduledEmails.add(attendee.email.toLowerCase());
          }
        });
      });
      
      console.log(`📧 Found ${scheduledEmails.size} scheduled email addresses in calendar`);
      
      if (scheduledEmails.size === 0) {
        return { updatedSlots: 0 };
      }
      
      // Update TentativeSlots for contacts that have been scheduled
      const updateResult = await TentativeSlot.updateMany(
        {
          userId: userId,
          contactEmail: { $in: Array.from(scheduledEmails) },
          status: 'confirmed'
        },
        {
          status: 'scheduled'
        }
      );
      
      console.log(`📊 Updated ${updateResult.modifiedCount} slots to scheduled status`);
      
      return {
        updatedSlots: updateResult.modifiedCount,
        scheduledEmails: Array.from(scheduledEmails)
      };
      
    } catch (error) {
      console.error('❌ Scheduled events sync failed:', error);
      throw error;
    }
  }
  
  /**
   * Get sync status and next sync time for a user
   */
  static async getSyncStatus(userId) {
    const user = await User.findOne({ googleId: userId });
    const syncFrequency = user?.advanced?.syncFrequency || 'hourly';
    const lastSync = user?.lastCalendarSync || null;
    
    let nextSyncTime = null;
    let syncIntervalMs;
    
    switch (syncFrequency) {
      case 'realtime':
        nextSyncTime = 'immediate';
        syncIntervalMs = 0;
        break;
      case 'hourly':
        syncIntervalMs = 60 * 60 * 1000;
        break;
      case 'daily':
        syncIntervalMs = 24 * 60 * 60 * 1000;
        break;
      default:
        syncIntervalMs = 60 * 60 * 1000;
    }
    
    if (lastSync && nextSyncTime !== 'immediate') {
      nextSyncTime = new Date(lastSync.getTime() + syncIntervalMs);
    }
    
    // Count pending sync items
    const pendingSync = await TentativeSlot.countDocuments({
      userId: userId,
      status: 'confirmed',
      addedToGoogleCal: { $ne: true },
      'timeSlot.start': { $gt: new Date() }
    });
    
    return {
      syncFrequency,
      lastSync: lastSync?.toISOString() || null,
      nextSync: nextSyncTime === 'immediate' ? 'immediate' : nextSyncTime?.toISOString() || null,
      pendingSyncCount: pendingSync,
      syncEnabled: true
    };
  }
}

module.exports = SyncService;