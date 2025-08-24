import { api } from '@/lib/api';
import { ApiResponse } from '@/lib/types';

/**
 * Pending Events Service
 * 
 * Manages confirmed time slots that are blocking future scheduling.
 * These are "pending events" - slots that have been confirmed but not yet 
 * turned into actual calendar events.
 */

export interface PendingEvent {
  id: string;
  sessionId: string;
  contactName: string;
  contactEmail?: string;
  timeSlot: string; // Human readable like "Mon 9-10am"
  rawTimeSlot: {
    start: string; // ISO string
    end: string; // ISO string
  };
  timezone: string;
  duration: number; // minutes
  createdAt: string;
  status: 'pending' | 'scheduled' | 'cancelled';
  userId: string;
}

export interface PendingEventCreateRequest {
  sessionId: string;
  contactName: string;
  contactEmail?: string;
  selectedSlot: string;
  timezone: string;
  duration: number;
}

interface BulkCreateResponse {
  created: PendingEvent[];
  blocked: string[];
}

interface BlockedSlotsResponse {
  data: Array<{
    start: string;
    end: string;
    reason: string;
  }>;
}

interface CleanupResponse {
  cleaned: number;
  remaining: number;
}

interface ConflictCheckResponse {
  hasConflict: boolean;
  conflictingEvent?: PendingEvent;
  suggestion?: string;
}

interface StatsResponse {
  total: number;
  byStatus: { pending: number; scheduled: number; cancelled: number };
  oldestPending?: string;
  recentActivity: number;
}

export class PendingEventsService {
  
  /**
   * Get all pending events for the current user
   * These represent time slots that are currently blocked from scheduling
   */
  static async getPendingEvents(): Promise<PendingEvent[]> {
    try {
      const response = await api.get<ApiResponse<PendingEvent[]>>('/pending-events');
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to get pending events:', error);
      return [];
    }
  }

  /**
   * Create pending events from confirmed scheduling selections
   * This is called when user confirms their time slot selections
   */
  static async createPendingEvents(
    events: PendingEventCreateRequest[]
  ): Promise<{
    created: PendingEvent[];
    blocked: string[]; // List of time slots now blocked
  }> {
    try {
      const response = await api.post<ApiResponse<BulkCreateResponse>>('/pending-events/bulk', {
        events,
        timestamp: new Date().toISOString()
      });

      return {
        created: response.data.data.created || [],
        blocked: response.data.data.blocked || []
      };
    } catch (error) {
      console.error('Failed to create pending events:', error);
      throw new Error('Unable to create pending events. Please try again.');
    }
  }

  /**
   * Clear/cancel a specific pending event
   * This removes the time slot from the blocked list
   */
  static async clearPendingEvent(eventId: string): Promise<void> {
    try {
      await api.delete(`/pending-events/${eventId}`);
    } catch (error) {
      console.error('Failed to clear pending event:', error);
      throw new Error('Unable to cancel pending event. Please try again.');
    }
  }

  /**
   * Mark a pending event as scheduled (moved to calendar)
   * This happens when the event is added to Google Calendar
   */
  static async markAsScheduled(eventId: string, calendarEventId?: string): Promise<void> {
    try {
      await api.patch(`/pending-events/${eventId}/scheduled`, {
        calendarEventId,
        scheduledAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to mark event as scheduled:', error);
      throw new Error('Unable to update event status. Please try again.');
    }
  }

  /**
   * Get blocked time slots for scheduling conflict detection
   * Returns list of time ranges that should not be available for new scheduling
   */
  static async getBlockedTimeSlots(): Promise<Array<{
    start: string;
    end: string;
    reason: string; // e.g., "Pending meeting with John Smith"
  }>> {
    try {
      const response = await api.get<ApiResponse<BlockedSlotsResponse>>('/pending-events/blocked-slots');
      return response.data.data.data || [];
    } catch (error) {
      console.error('Failed to get blocked time slots:', error);
      return [];
    }
  }

  /**
   * Bulk clear multiple pending events
   * Useful for cleaning up old or cancelled scheduling sessions
   */
  static async bulkClearPendingEvents(eventIds: string[]): Promise<void> {
    try {
      await api.post('/pending-events/bulk-clear', {
        eventIds,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to bulk clear pending events:', error);
      throw new Error('Unable to clear pending events. Please try again.');
    }
  }

  /**
   * Auto-cleanup old pending events
   * Called periodically to remove stale pending events that were never scheduled
   */
  static async cleanupStaleEvents(olderThanDays: number = 7): Promise<{
    cleaned: number;
    remaining: number;
  }> {
    try {
      const response = await api.post<ApiResponse<CleanupResponse>>('/pending-events/cleanup', {
        olderThanDays,
        timestamp: new Date().toISOString()
      });

      return {
        cleaned: response.data.data.cleaned || 0,
        remaining: response.data.data.remaining || 0
      };
    } catch (error) {
      console.error('Failed to cleanup stale events:', error);
      throw new Error('Unable to cleanup old events. Please try again.');
    }
  }

  /**
   * Check if a specific time slot conflicts with pending events
   * Used during scheduling to prevent double-booking
   */
  static async checkTimeSlotConflict(
    startTime: string,
    endTime: string,
    timezone: string
  ): Promise<{
    hasConflict: boolean;
    conflictingEvent?: PendingEvent;
    suggestion?: string;
  }> {
    try {
      const response = await api.post<ApiResponse<ConflictCheckResponse>>('/pending-events/check-conflict', {
        startTime,
        endTime,
        timezone
      });

      return response.data.data;
    } catch (error) {
      console.error('Failed to check time slot conflict:', error);
      return { hasConflict: false };
    }
  }

  /**
   * Get statistics about pending events
   * Useful for dashboard or management views
   */
  static async getPendingEventsStats(): Promise<{
    total: number;
    byStatus: { pending: number; scheduled: number; cancelled: number };
    oldestPending?: string;
    recentActivity: number; // Events created in last 24h
  }> {
    try {
      const response = await api.get<ApiResponse<StatsResponse>>('/pending-events/stats');
      return response.data.data;
    } catch (error) {
      console.error('Failed to get pending events stats:', error);
      return {
        total: 0,
        byStatus: { pending: 0, scheduled: 0, cancelled: 0 },
        recentActivity: 0
      };
    }
  }

}

// Export instance for easier importing
export const pendingEventsService = PendingEventsService;