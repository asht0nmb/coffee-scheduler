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
   * Get upcoming events (scheduled events in the future)
   * @param limit Number of events to return (default: unlimited)
   * @returns Array of upcoming events
   */
  static getUpcomingEvents(limit?: number): Event[] {
    const now = new Date();
    const upcomingEvents = mockEvents
      .filter(event => event.status === 'scheduled' && event.date > now)
      .sort((a, b) => a.date.getTime() - b.date.getTime()); // Sort ascending for upcoming
    
    return limit ? upcomingEvents.slice(0, limit) : upcomingEvents;
  }

  /**
   * Get all scheduled events (both past and future scheduled events)
   * @returns Array of all scheduled events
   */
  static getScheduledEvents(): Event[] {
    return mockEvents
      .filter(event => event.status === 'scheduled')
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Get events for a specific week (for calendar display)
   * @param weekStartDate Start date of the week
   * @returns Array of events within that week
   */
  static getEventsForWeek(weekStartDate: Date): Event[] {
    const weekEnd = new Date(weekStartDate);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return mockEvents
      .filter(event => event.date >= weekStartDate && event.date <= weekEnd)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Get events for a specific day
   * @param targetDate The date to get events for
   * @returns Array of events on that day
   */
  static getEventsForDay(targetDate: Date): Event[] {
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    return mockEvents
      .filter(event => event.date >= dayStart && event.date <= dayEnd)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
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

  /**
   * Helper method to check if an event is upcoming
   * @param event Event to check
   * @returns True if event is scheduled and in the future
   */
  static isUpcoming(event: Event): boolean {
    const now = new Date();
    return event.status === 'scheduled' && event.date > now;
  }

  /**
   * Helper method to check if an event is past
   * @param event Event to check  
   * @returns True if event date is in the past
   */
  static isPast(event: Event): boolean {
    const now = new Date();
    return event.date < now;
  }
}

// Export default instance for easier importing
export const eventsService = EventsService;