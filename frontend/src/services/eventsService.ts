import { Event, EventSummary, eventToSummary } from '@/types/events';
import { mockEvents } from '@/data/mockEvents';

/**
 * Events Service
 * 
 * This service provides a centralized API for event data management.
 * Currently uses mock data, but can easily be replaced with real API calls
 * when backend integration is ready.
 */
export class EventsService {
  /**
   * Get recent events for sidebar display
   * @param limit Number of events to return (default: 6)
   * @returns Array of EventSummary objects for sidebar
   */
  static getRecentEvents(limit: number = 6): EventSummary[] {
    // Sort by date descending (most recent first)
    const sortedEvents = [...mockEvents].sort((a, b) => b.date.getTime() - a.date.getTime());
    
    return sortedEvents
      .slice(0, limit)
      .map(eventToSummary);
  }

  /**
   * Get all past events for the full past events page
   * @returns Array of all Event objects
   */
  static getAllPastEvents(): Event[] {
    // Sort by date descending (most recent first)
    return [...mockEvents].sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Get a specific event by ID
   * @param id Event ID
   * @returns Event object or undefined if not found
   */
  static getEventById(id: string): Event | undefined {
    return mockEvents.find(event => event.id === id);
  }

  /**
   * Get events by status
   * @param status Event status to filter by
   * @returns Array of events with the specified status
   */
  static getEventsByStatus(status: Event['status']): Event[] {
    return mockEvents
      .filter(event => event.status === status)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Get events within a date range
   * @param startDate Start date
   * @param endDate End date
   * @returns Array of events within the date range
   */
  static getEventsByDateRange(startDate: Date, endDate: Date): Event[] {
    return mockEvents
      .filter(event => event.date >= startDate && event.date <= endDate)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Get total count of events by status
   * @returns Object with counts for each status
   */
  static getEventCounts() {
    const counts = {
      completed: 0,
      cancelled: 0,
      scheduled: 0,
      total: mockEvents.length
    };

    mockEvents.forEach(event => {
      counts[event.status]++;
    });

    return counts;
  }
}

// Export default instance for easier importing
export const eventsService = EventsService;