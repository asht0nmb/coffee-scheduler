import { apiAdapter } from '@/lib/api-adapter';
import { AppError, validateRequired } from '@/lib/error-handling';
import { NewContact, TimeSlot } from '@/lib/types';
import { contactsService } from './contactsService';

interface ConfirmationResponse {
  confirmedEvents: Array<{
    id: string;
    contactName: string;
    finalTimeSlot: string;
    status: 'pending';
  }>;
  blockedSlots: string[];
}

interface SessionData {
  sessionId: string;
  participants: Array<{
    id: string;
    name: string;
    timezone: string;
    email?: string;
    timeSlots: string[];
  }>;
  duration: number;
}


/**
 * Scheduling Service
 * 
 * Handles communication with the backend scheduling algorithm to:
 * 1. Submit batch contact data to backend
 * 2. Receive 3 optimal time slots per person 
 * 3. Manage scheduling session state
 * 4. Handle slot confirmations and pending events
 */
export class SchedulingService {
  
  /**
   * Create a new scheduling session by sending contacts to backend
   * Backend will return 3 optimal slots per person considering timezones
   * 
   * @param contacts Array of contacts to schedule with
   * @param duration Meeting duration in minutes
   * @param options Additional scheduling options
   * @returns Promise with scheduling session data
   */
  static async createSchedulingSession(
    contacts: NewContact[], 
    duration: number,
    options?: {
      dateRange?: { start: string; end: string };
      consultantMode?: boolean;
    }
  ): Promise<{
    sessionId: string;
    participants: Array<{
      id: string;
      name: string;
      timezone: string;
      email?: string;
      timeSlots: string[]; // Human-readable slots like "Mon 9-10am"
    }>;
    metadata: {
      algorithm: string;
      totalContacts: number;
      successfullyScheduled: number;
    };
  }> {
    try {
      // Step 1: Filter and validate frontend contacts
      const validContacts = contacts.filter(contact => contact.name.trim());
      
      if (validContacts.length === 0) {
        throw new AppError({
          message: 'No valid contacts provided',
          code: 'VALIDATION_ERROR',
          userMessage: 'Please provide at least one contact with a name.',
          retryable: false
        });
      }

      // Step 2: Create contacts in database first to get MongoDB ObjectIds
      const createdContacts = await Promise.all(
        validContacts.map(async (contact) => {
          try {
            const contactData = {
              name: contact.name.trim(),
              email: contact.email?.trim() || '',
              timezone: contact.timezone,
              meetingPreferences: {
                duration: duration,
                timeOfDay: 'any' // Default preference
              }
            };
            
            // Create contact in backend database
            return await contactsService.createContact(contactData);
          } catch (error) {
            console.error(`❌ Failed to create contact ${contact.name}:`, {
              originalContact: contact,
              transformedData: contactData,
              error: error instanceof Error ? error.message : error,
              stack: error instanceof Error ? error.stack : undefined,
              errorType: error instanceof AppError ? 'AppError' : 'Unknown',
              timestamp: new Date().toISOString()
            });
            
            // Log more detailed debugging info for different error types
            if (error instanceof AppError) {
              console.error(`🔍 AppError details for ${contact.name}:`, {
                code: error.code,
                userMessage: error.userMessage,
                retryable: error.retryable,
                originalError: error.originalError?.message,
                context: error.context
              });
            }
            
            // Log network/response info if available
            if (error && typeof error === 'object' && 'response' in error) {
              const networkError = error as { response?: { status?: number; statusText?: string; data?: unknown; headers?: unknown } };
              console.error(`🌐 Network error details for ${contact.name}:`, {
                status: networkError.response?.status,
                statusText: networkError.response?.statusText,
                data: networkError.response?.data,
                headers: networkError.response?.headers
              });
            }
            
            // Continue with other contacts even if one fails
            return null;
          }
        })
      );

      // Filter out failed contact creations
      const successfulContacts = createdContacts.filter(contact => contact !== null);
      
      if (successfulContacts.length === 0) {
        const failedCount = validContacts.length;
        console.error('All contact creation attempts failed:', {
          attempted: failedCount,
          successful: 0,
          originalContacts: contacts,
          validContacts: validContacts
        });
        
        throw new AppError({
          message: `Failed to create any contacts (${failedCount} attempts failed)`,
          code: 'CONTACT_CREATION_ERROR',
          userMessage: 'Unable to create contacts in the database. Check your network connection and try again.',
          retryable: true
        });
      }

      // Step 3: Extract MongoDB ObjectIds for scheduling
      const contactIds = successfulContacts.map(contact => contact._id);

      // Step 4: Create scheduling request with ObjectIds
      const schedulingRequest = {
        contactIds,
        slotsPerContact: 3,
        dateRange: options?.dateRange,
        consultantMode: options?.consultantMode || true
      };

      // Step 5: Call backend advanced scheduling algorithm
      const response = await apiAdapter.post('/api/scheduling', schedulingRequest);

      if (!response.success || !response.data) {
        throw new AppError({
          message: 'Backend scheduling algorithm failed',
          code: 'SCHEDULING_ALGORITHM_ERROR',
          userMessage: 'Unable to generate time slots. Please try again.',
          retryable: true
        });
      }

      // Step 6: Transform backend response to frontend format
      const schedulingData = response.data as Record<string, unknown>;
      const sessionId = (schedulingData.batchId as string) || Date.now().toString();
      
      return {
        sessionId,
        participants: (schedulingData.results as Array<Record<string, unknown>>).map((result: Record<string, unknown>) => ({
          id: (result.contact as Record<string, unknown>)?.id as string,
          name: (result.contact as Record<string, unknown>)?.name as string,
          timezone: (result.contact as Record<string, unknown>)?.timezone as string,
          email: (result.contact as Record<string, unknown>)?.email as string,
          timeSlots: ((result.suggestedSlots as Array<Record<string, unknown>>)|| []).map(slot => 
            (slot.displayTimes as Record<string, unknown>)?.contact as string || `${slot.start} - ${slot.end}`
          )
        })),
        metadata: {
          algorithm: (schedulingData.algorithm as string) || 'advanced',
          totalContacts: ((schedulingData.statistics as Record<string, unknown>)?.totalContacts as number) || successfulContacts.length,
          successfullyScheduled: ((schedulingData.statistics as Record<string, unknown>)?.totalSlots as number) || 0
        }
      };

    } catch (error) {
      // If it's already an AppError, just rethrow it (error handling was done by API adapter)
      if (error instanceof AppError) {
        throw error;
      }

      console.error('Failed to create scheduling session:', error);
      throw new AppError({
        message: 'Failed to create scheduling session',
        code: 'SCHEDULING_CREATE_ERROR',
        userMessage: 'Unable to generate time slots. Please try again.',
        originalError: error as Error,
        retryable: true
      });
    }
  }

  /**
   * Get scheduling session data by ID
   * Used when navigating to /scheduling/[id] page
   */
  static async getSchedulingSession(sessionId: string): Promise<SessionData | null> {
    try {
      validateRequired({ sessionId }, ['sessionId'], { sessionId: 'Session ID' });
      
      const response = await apiAdapter.get<SessionData>(`/api/scheduling/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get scheduling session:', error);
      // Return null if session not found - page will handle appropriately
      return null;
    }
  }

  /**
   * Save scheduling session data for persistence between pages
   * Uses localStorage for now, could be moved to backend later
   */
  static saveSchedulingSession(sessionId: string, data: SessionData): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`scheduling_session_${sessionId}`, JSON.stringify({
          ...data,
          savedAt: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('Failed to save scheduling session:', error);
    }
  }

  /**
   * Load scheduling session data from storage
   */
  static loadSchedulingSession(sessionId: string): SessionData | null {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(`scheduling_session_${sessionId}`);
        return stored ? JSON.parse(stored) : null;
      }
      return null;
    } catch (error) {
      console.error('Failed to load scheduling session:', error);
      return null;
    }
  }

  /**
   * Confirm selected time slots and create pending events
   * This sends the user's final selections back to backend
   */
  static async confirmTimeSlots(
    sessionId: string, 
    selections: Array<{
      contactId: string;
      selectedSlot: string;
      alternateSlots?: string[];
    }>
  ): Promise<{
    confirmedEvents: Array<{
      id: string;
      contactName: string;
      finalTimeSlot: string;
      status: 'pending';
    }>;
    blockedSlots: string[];
  }> {
    try {
      validateRequired({ sessionId }, ['sessionId'], { sessionId: 'Session ID' });

      if (!Array.isArray(selections) || selections.length === 0) {
        throw new AppError({
          message: 'No selections provided',
          code: 'VALIDATION_ERROR',
          userMessage: 'Please select at least one time slot before confirming.',
          retryable: false
        });
      }

      const response = await apiAdapter.post<ConfirmationResponse>('/api/scheduling/confirm', {
        sessionId,
        selections,
        timestamp: new Date().toISOString()
      });

      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      console.error('Failed to confirm time slots:', error);
      throw new AppError({
        message: 'Failed to confirm time slots',
        code: 'SCHEDULING_CONFIRM_ERROR',
        userMessage: 'Unable to confirm meeting times. Please try again.',
        originalError: error as Error,
        retryable: true
      });
    }
  }

  /**
   * Get pending events for a user
   * These are confirmed slots that are blocking future scheduling
   */
  static async getPendingEvents(): Promise<Array<{
    id: string;
    contactName: string;
    timeSlot: string;
    createdAt: string;
    status: 'pending' | 'scheduled' | 'cancelled';
  }>> {
    try {
      const response = await apiAdapter.get<Array<{
        id: string;
        contactName: string;
        timeSlot: string;
        createdAt: string;
        status: 'pending' | 'scheduled' | 'cancelled';
      }>>('/api/scheduling/suggestions');
      return response.data || [];
    } catch (error) {
      console.error('Failed to get pending events:', error);
      return [];
    }
  }

  /**
   * Clear/cancel a pending event 
   * Removes the time slot from blocked list
   */
  static async clearPendingEvent(eventId: string): Promise<void> {
    try {
      validateRequired({ eventId }, ['eventId'], { eventId: 'Event ID' });
      
      await apiAdapter.delete(`/api/scheduling/suggestions/${eventId}`);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      console.error('Failed to clear pending event:', error);
      throw new AppError({
        message: 'Failed to clear pending event',
        code: 'PENDING_EVENT_CLEAR_ERROR',
        userMessage: 'Unable to clear event. Please try again.',
        originalError: error as Error,
        retryable: true
      });
    }
  }

  /**
   * Transform backend TimeSlot to human-readable display format
   * Backend gives UTC timestamps, frontend needs "Mon 9-10am" format
   */
  private static formatTimeSlotForDisplay(slot: TimeSlot): string {
    try {
      // Parse backend time slot (assume ISO strings for now)
      const startTime = new Date(slot.start);
      const endTime = new Date(slot.end);
      
      // Format to human-readable string
      const dayName = startTime.toLocaleDateString('en-US', { weekday: 'short' });
      const startFormatted = startTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: startTime.getMinutes() ? '2-digit' : undefined,
        hour12: true 
      });
      const endFormatted = endTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: endTime.getMinutes() ? '2-digit' : undefined,
        hour12: true 
      });

      return `${dayName} ${startFormatted}-${endFormatted}`;
    } catch (error) {
      console.error('Failed to format time slot:', error);
      // Fallback to original slot data
      return `${slot.start} - ${slot.end}`;
    }
  }

  /**
   * Check if backend is available
   * Used for health checks and fallback to mock data
   */
  static async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await apiAdapter.get<{ message: string }>('/api/health');
      return response.success && !!response.data;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }

  /**
   * Emergency fallback: Generate mock scheduling data
   * Used when backend is unavailable
   */
  static generateMockSchedulingData(contacts: NewContact[]): {
    sessionId: string;
    participants: Array<{
      id: string;
      name: string;
      timezone: string;
      email?: string;
      timeSlots: string[];
    }>;
    metadata: {
      algorithm: string;
      totalContacts: number;
      successfullyScheduled: number;
    };
  } {
    const sessionId = Date.now().toString();
    const mockSlots = ['Mon 9-10am', 'Wed 2-3pm', 'Fri 11-12pm'];
    
    const participants = contacts
      .filter(contact => contact.name.trim())
      .map(contact => ({
        id: contact.id,
        name: contact.name,
        timezone: contact.timezone,
        email: contact.email,
        timeSlots: [...mockSlots] // Each person gets same mock slots for now
      }));

    return {
      sessionId,
      participants,
      metadata: {
        algorithm: 'mock_fallback',
        totalContacts: participants.length,
        successfullyScheduled: participants.length
      }
    };
  }
}

// Export instance for easier importing
export const schedulingService = SchedulingService;