import { Event, EventSummary, eventToSummary } from '@/types/events';
import { mockEvents } from '@/data/mockEvents';
import { apiAdapter } from '@/lib/api-adapter';

/**
 * Events Service
 * 
 * This service provides a centralized API for event data management.
 * Now integrated with the backend API via the API adapter layer.
 */
export class EventsService {
  // Cache for events to reduce API calls
  private static eventsCache: Event[] = [];
  private static cacheTimestamp = 0;
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if cache is valid and return cached events
   */
  private static getCachedEvents(): Event[] | null {
    const now = Date.now();
    if (this.eventsCache.length > 0 && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      return this.eventsCache;
    }
    return null;
  }

  /**
   * Fetch all events from the backend
   */
  private static async fetchAllEvents(): Promise<Event[]> {
    try {
      // Try to use cached events first
      const cached = this.getCachedEvents();
      if (cached) {
        return cached;
      }

      // Fetch from backend
      const response = await apiAdapter.get<Event[]>('/api/events');
      const events = response.data || [];

      // Update cache
      this.eventsCache = events;
      this.cacheTimestamp = Date.now();

      return events;
    } catch (error) {
      console.warn('Failed to fetch events from backend, falling back to mock data:', error);
      // Fallback to mock data if API fails
      return mockEvents;
    }
  }

  /**
   * Clear the events cache (useful after creating/updating events)
   */
  public static clearCache(): void {
    this.eventsCache = [];
    this.cacheTimestamp = 0;
  }
  /**
   * Get recent events for sidebar display
   * @param limit Number of events to return (default: 6)
   * @returns Array of EventSummary objects for sidebar
   */
  static async getRecentEvents(limit: number = 6): Promise<EventSummary[]> {
    const events = await this.fetchAllEvents();
    // Sort by date descending (most recent first)
    const sortedEvents = [...events].sort((a, b) => b.date.getTime() - a.date.getTime());
    
    return sortedEvents
      .slice(0, limit)
      .map(eventToSummary);
  }

  /**
   * Get all past events for the full past events page
   * @returns Array of all Event objects
   */
  static async getAllPastEvents(): Promise<Event[]> {
    try {
      const response = await apiAdapter.get<Event[]>('/api/events/past');
      return response.data || [];
    } catch (error) {
      console.warn('Failed to fetch past events, falling back to cached/mock data:', error);
      const events = await this.fetchAllEvents();
      return events.sort((a, b) => b.date.getTime() - a.date.getTime());
    }
  }

  /**
   * Get a specific event by ID
   * @param id Event ID
   * @returns Event object or undefined if not found
   */
  static async getEventById(id: string): Promise<Event | undefined> {
    try {
      const response = await apiAdapter.get<Event>(`/api/events/${id}`);
      return response.data;
    } catch (error) {
      console.warn(`Failed to fetch event ${id}, falling back to cached data:`, error);
      const events = await this.fetchAllEvents();
      return events.find(event => event.id === id);
    }
  }

  /**
   * Get events by status
   * @param status Event status to filter by
   * @returns Array of events with the specified status
   */
  static async getEventsByStatus(status: Event['status']): Promise<Event[]> {
    const events = await this.fetchAllEvents();
    return events
      .filter(event => event.status === status)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Get upcoming events (scheduled events in the future)
   * @param limit Number of events to return (default: unlimited)
   * @returns Array of upcoming events
   */
  static async getUpcomingEvents(limit?: number): Promise<Event[]> {
    try {
      const response = await apiAdapter.get<Event[]>('/api/events/upcoming');
      const events = response.data || [];
      return limit ? events.slice(0, limit) : events;
    } catch (error) {
      console.warn('Failed to fetch upcoming events, falling back to cached/mock data:', error);
      const events = await this.fetchAllEvents();
      const now = new Date();
      const upcomingEvents = events
        .filter(event => event.status === 'scheduled' && event.date > now)
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      return limit ? upcomingEvents.slice(0, limit) : upcomingEvents;
    }
  }

  /**
   * Get all scheduled events (both past and future scheduled events)
   * @returns Array of all scheduled events
   */
  static async getScheduledEvents(): Promise<Event[]> {
    return this.getEventsByStatus('scheduled');
  }

  /**
   * Get events for a specific week (for calendar display)
   * @param weekStartDate Start date of the week
   * @returns Array of events within that week
   */
  static async getEventsForWeek(weekStartDate: Date): Promise<Event[]> {
    const weekEnd = new Date(weekStartDate);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return this.getEventsByDateRange(weekStartDate, weekEnd);
  }

  /**
   * Get events for a specific day
   * @param targetDate The date to get events for
   * @returns Array of events on that day
   */
  static async getEventsForDay(targetDate: Date): Promise<Event[]> {
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    return this.getEventsByDateRange(dayStart, dayEnd);
  }

  /**
   * Get events within a date range
   * @param startDate Start date
   * @param endDate End date
   * @returns Array of events within the date range
   */
  static async getEventsByDateRange(startDate: Date, endDate: Date): Promise<Event[]> {
    const events = await this.fetchAllEvents();
    return events
      .filter(event => event.date >= startDate && event.date <= endDate)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Get total count of events by status
   * @returns Object with counts for each status
   */
  static async getEventCounts() {
    const events = await this.fetchAllEvents();
    const counts = {
      completed: 0,
      cancelled: 0,
      scheduled: 0,
      total: events.length
    };

    events.forEach(event => {
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