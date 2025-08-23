/**
 * API Adapter Layer
 * Maps frontend API expectations to backend reality
 * Handles data transformation and error handling
 */

import { api } from '@/lib/api';
import { AxiosResponse, AxiosRequestConfig } from 'axios';
import { parseApiError, logError, withRetry, AppError, RetryOptions } from '@/lib/error-handling';

// Types for API responses
export interface APIResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface APIError {
  message: string;
  code?: string | number;
  status?: number;
  details?: unknown;
}

/**
 * API Adapter Class
 * Centralizes all API communication and transforms data between frontend and backend
 */
export class APIAdapter {
  // Route mapping: frontend routes -> backend routes
  private routeMap: Record<string, string> = {
    // Authentication routes (direct mapping)
    '/api/auth/google': '/api/auth/google',
    '/api/auth/status': '/api/auth/status',
    '/api/auth/logout': '/api/auth/logout',
    
    // Contact routes (direct mapping)
    '/api/contacts': '/api/contacts',
    
    // Event routes (map to calendar endpoints)
    '/api/events': '/api/calendar/events',
    '/api/events/past': '/api/calendar/events?filter=past',
    '/api/events/upcoming': '/api/calendar/events?filter=upcoming',
    
    // Scheduling routes (map to calendar scheduling)
    '/api/scheduling': '/api/calendar/schedule-batch-advanced',
    '/api/scheduling/generate': '/api/calendar/schedule-batch-advanced', 
    '/api/scheduling/suggestions': '/api/calendar/suggestions',
    '/api/scheduling/clear': '/api/calendar/clear-suggestions',
    
    // Settings routes (map to user routes)
    '/api/settings': '/api/user/preferences',
    '/api/settings/profile': '/api/user/profile',
    '/api/settings/export': '/api/user/export', // TODO: implement if needed
    
    // Health check
    '/api/health': '/api/health'
  };

  /**
   * Main request method that handles route mapping and error handling
   */
  async request<T = unknown>(
    frontendRoute: string, 
    options: AxiosRequestConfig = {},
    retryOptions?: RetryOptions
  ): Promise<APIResponse<T>> {
    const operation = async (): Promise<APIResponse<T>> => {
      try {
        // Map frontend route to backend route
        const backendRoute = this.mapRoute(frontendRoute);
        
        // Prepare request config
        const config: AxiosRequestConfig = {
          ...options,
          url: backendRoute,
          timeout: options.timeout || 30000, // 30 second default timeout
        };

        // Transform request data if needed
        if (config.data) {
          config.data = this.transformRequestData(frontendRoute, config.data);
        }

        // Make the API call
        const response: AxiosResponse = await api.request(config);
        
        // Transform response data
        const transformedData = this.transformResponseData(frontendRoute, response.data);
        
        return {
          data: transformedData as T,
          success: true,
          message: response.data?.message
        };

      } catch (error: unknown) {
        const appError = this.handleError(error, frontendRoute);
        logError(appError, { 
          frontendRoute, 
          backendRoute: this.mapRoute(frontendRoute),
          requestData: options.data 
        });
        throw appError;
      }
    };

    // Use retry logic if specified or for certain operations
    if (retryOptions || this.shouldRetry(frontendRoute, options.method)) {
      return withRetry(operation, {
        maxAttempts: 3,
        retryCondition: (error) => error instanceof AppError && error.retryable,
        ...retryOptions
      });
    }

    return operation();
  }

  /**
   * Convenience methods for common HTTP verbs
   */
  async get<T = unknown>(frontendRoute: string, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
    return this.request<T>(frontendRoute, { ...config, method: 'GET' });
  }

  async post<T = unknown>(frontendRoute: string, data?: unknown, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
    return this.request<T>(frontendRoute, { ...config, method: 'POST', data });
  }

  async put<T = unknown>(frontendRoute: string, data?: unknown, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
    return this.request<T>(frontendRoute, { ...config, method: 'PUT', data });
  }

  async delete<T = unknown>(frontendRoute: string, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
    return this.request<T>(frontendRoute, { ...config, method: 'DELETE' });
  }

  /**
   * Maps frontend routes to backend routes
   */
  private mapRoute(frontendRoute: string): string {
    // Handle parameterized routes
    const routeBase = frontendRoute.split('?')[0]; // Remove query params for mapping
    const queryParams = frontendRoute.split('?')[1]; // Preserve query params
    
    let backendRoute = this.routeMap[routeBase] || frontendRoute;
    
    // Handle dynamic routes (e.g., /api/contacts/:id)
    if (!this.routeMap[routeBase]) {
      // Check for parameterized versions
      const segments = routeBase.split('/');
      for (const [frontendPattern, backendPattern] of Object.entries(this.routeMap)) {
        const frontendSegments = frontendPattern.split('/');
        if (segments.length === frontendSegments.length) {
          let matches = true;
          for (let i = 0; i < segments.length; i++) {
            if (frontendSegments[i] !== segments[i] && !frontendSegments[i].startsWith(':')) {
              matches = false;
              break;
            }
          }
          if (matches) {
            // Replace parameters in backend route
            const backendSegments = backendPattern.split('/');
            for (let i = 0; i < segments.length; i++) {
              if (frontendSegments[i].startsWith(':')) {
                backendSegments[i] = segments[i];
              }
            }
            backendRoute = backendSegments.join('/');
            break;
          }
        }
      }
    }

    // Re-add query parameters
    if (queryParams) {
      backendRoute += '?' + queryParams;
    }

    return backendRoute;
  }

  /**
   * Transforms request data from frontend format to backend format
   */
  private transformRequestData(frontendRoute: string, data: unknown): unknown {
    // Handle specific route transformations
    if (frontendRoute.includes('/api/scheduling')) {
      return this.transformSchedulingRequest(data as Record<string, unknown>);
    }
    
    if (frontendRoute.includes('/api/events')) {
      return this.transformEventRequest(data as Record<string, unknown>);
    }

    if (frontendRoute.includes('/api/contacts')) {
      return this.transformContactRequest(data as Record<string, unknown>);
    }

    // Default: return data as-is
    return data;
  }

  /**
   * Transforms response data from backend format to frontend format
   */
  private transformResponseData(frontendRoute: string, data: unknown): unknown {
    // Handle specific route transformations
    if (frontendRoute.includes('/api/events')) {
      return this.transformEventResponse(data);
    }
    
    if (frontendRoute.includes('/api/scheduling')) {
      return this.transformSchedulingResponse(data as Record<string, unknown>);
    }

    if (frontendRoute.includes('/api/contacts')) {
      return this.transformContactResponse(data as Record<string, unknown>);
    }

    if (frontendRoute.includes('/api/settings')) {
      return this.transformSettingsResponse(data as Record<string, unknown>);
    }

    // Default: return data as-is
    return data;
  }

  /**
   * Transform scheduling request data
   */
  private transformSchedulingRequest(data: Record<string, unknown>): Record<string, unknown> {
    // Transform frontend scheduling request to backend calendar request
    return {
      contacts: (data.contactIds as string[])?.map((id: string) => ({ id })) || data.contacts || [],
      duration: data.duration || 30,
      slotsPerContact: data.slotsPerContact || 3,
      dateRange: data.dateRange || {
        start: new Date().toISOString(),
        end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 2 weeks
      },
      algorithmMode: data.consultantMode ? 'advanced' : 'basic'
    };
  }

  /**
   * Transform scheduling response data
   */
  private transformSchedulingResponse(data: Record<string, unknown>): Record<string, unknown> {
    // Transform backend calendar response to frontend scheduling format
    if (data.suggestions) {
      return {
        sessionId: data.sessionId || Date.now().toString(),
        participants: (data.suggestions as Array<Record<string, unknown>>).map((suggestion: Record<string, unknown>) => ({
          id: suggestion.contactId || (suggestion.contact as Record<string, unknown>)?.id,
          name: suggestion.contactName || (suggestion.contact as Record<string, unknown>)?.name,
          email: suggestion.contactEmail || (suggestion.contact as Record<string, unknown>)?.email,
          timezone: suggestion.timezone || (suggestion.contact as Record<string, unknown>)?.timezone,
          timeSlots: (suggestion.slots as Array<Record<string, unknown>>)?.map((slot: Record<string, unknown>) => slot.displayTime || slot.time) || []
        }))
      };
    }
    return data;
  }

  /**
   * Transform event request data
   */
  private transformEventRequest(data: Record<string, unknown>): Record<string, unknown> {
    // Transform frontend event data to backend calendar data
    return {
      title: data.title || 'Coffee Chat',
      participants: data.participants || [],
      duration: data.duration || 30,
      scheduledTime: data.date || data.scheduledTime,
      type: data.type || 'coffee_chat'
    };
  }

  /**
   * Transform event response data
   */
  private transformEventResponse(data: unknown): unknown {
    // Transform backend calendar events to frontend event format
    if (Array.isArray(data)) {
      return (data as Array<Record<string, unknown>>).map(event => this.transformSingleEvent(event));
    }
    
    if ((data as Record<string, unknown>).events) {
      return (((data as Record<string, unknown>).events) as Array<Record<string, unknown>>).map((event: Record<string, unknown>) => this.transformSingleEvent(event));
    }
    
    return data;
  }

  /**
   * Transform single event object
   */
  private transformSingleEvent(event: Record<string, unknown>): Record<string, unknown> {
    return {
      id: event._id || event.id,
      title: event.title || 'Coffee Chat',
      participants: event.participants || (event.contacts as Array<Record<string, unknown>>)?.map((c: Record<string, unknown>) => c.name) || [],
      date: new Date((event.scheduledTime || event.date) as string),
      status: this.mapEventStatus(event.status as string),
      duration: event.duration || 30,
      finalTimeSlot: (event.selectedSlot as Record<string, unknown>)?.displayTime || event.finalTimeSlot,
      type: event.type || 'coffee_chat',
      createdAt: event.createdAt ? new Date(event.createdAt as string) : undefined,
      updatedAt: event.updatedAt ? new Date(event.updatedAt as string) : undefined
    };
  }

  /**
   * Transform contact request data
   */
  private transformContactRequest(data: Record<string, unknown>): Record<string, unknown> {
    return {
      name: data.name,
      email: data.email,
      timezone: data.timezone,
      preferences: data.meetingPreferences || {
        duration: 30,
        timeOfDay: data.timeOfDay
      }
    };
  }

  /**
   * Transform contact response data
   */
  private transformContactResponse(data: unknown): unknown {
    if (Array.isArray(data)) {
      return (data as Array<Record<string, unknown>>).map(contact => this.transformSingleContact(contact));
    }
    
    if ((data as Record<string, unknown>).contacts) {
      return (((data as Record<string, unknown>).contacts) as Array<Record<string, unknown>>).map((contact: Record<string, unknown>) => this.transformSingleContact(contact));
    }
    
    return this.transformSingleContact(data as Record<string, unknown>);
  }

  /**
   * Transform single contact object
   */
  private transformSingleContact(contact: Record<string, unknown>): Record<string, unknown> {
    return {
      _id: contact._id || contact.id,
      userId: contact.userId,
      name: contact.name,
      email: contact.email,
      timezone: contact.timezone,
      status: contact.status || 'pending',
      meetingPreferences: contact.preferences || contact.meetingPreferences || {
        duration: 30
      },
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt
    };
  }

  /**
   * Transform settings response data
   */
  private transformSettingsResponse(data: Record<string, unknown>): Record<string, unknown> {
    return {
      user: data.user || data,
      preferences: data.preferences || {},
      settings: data.settings || {}
    };
  }

  /**
   * Map backend event status to frontend status
   */
  private mapEventStatus(backendStatus: string): 'completed' | 'cancelled' | 'scheduled' {
    const statusMap: Record<string, 'completed' | 'cancelled' | 'scheduled'> = {
      'completed': 'completed',
      'cancelled': 'cancelled',
      'scheduled': 'scheduled',
      'confirmed': 'scheduled',
      'pending': 'scheduled'
    };
    return statusMap[backendStatus] || 'scheduled';
  }

  /**
   * Determine if an operation should be retried
   */
  private shouldRetry(frontendRoute: string, method: string = 'GET'): boolean {
    // Retry GET requests and critical operations
    if (method.toUpperCase() === 'GET') return true;
    
    // Retry scheduling operations due to their importance
    if (frontendRoute.includes('/api/scheduling')) return true;
    
    // Retry health checks
    if (frontendRoute.includes('/api/health')) return true;
    
    return false;
  }

  /**
   * Handle and standardize API errors using the centralized error handling system
   */
  private handleError(error: unknown, frontendRoute?: string): AppError {
    return parseApiError(error as Error, {
      operation: `API Request: ${frontendRoute || 'unknown'}`,
      component: 'APIAdapter'
    });
  }
}

// Export singleton instance
export const apiAdapter = new APIAdapter();
export default apiAdapter;