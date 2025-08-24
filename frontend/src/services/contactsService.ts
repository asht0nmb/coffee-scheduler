/**
 * Contacts Service
 * 
 * This service provides a centralized API for contact data management.
 * Integrated with the backend API via the API adapter layer.
 */

import { apiAdapter } from '@/lib/api-adapter';
import { AppError, validateRequired } from '@/lib/error-handling';

// Contact interface based on frontend expectations
export interface Contact {
  _id: string;
  userId?: string;
  name: string;
  email: string;
  timezone: string;
  status: 'pending' | 'slots_generated' | 'email_sent' | 'scheduled' | 'completed';
  meetingPreferences?: {
    duration: number;
    timeOfDay?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NewContact {
  name: string;
  email: string;
  timezone: string;
  meetingPreferences?: {
    duration: number;
    timeOfDay?: string;
  };
}

export interface ContactsServiceResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
}

export class ContactsService {
  // Cache for contacts to reduce API calls
  private static contactsCache: Contact[] = [];
  private static cacheTimestamp = 0;
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if cache is valid and return cached contacts
   */
  private static getCachedContacts(): Contact[] | null {
    const now = Date.now();
    if (this.contactsCache.length > 0 && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      return this.contactsCache;
    }
    return null;
  }

  /**
   * Clear the contacts cache (useful after creating/updating contacts)
   */
  public static clearCache(): void {
    this.contactsCache = [];
    this.cacheTimestamp = 0;
  }

  /**
   * Get all contacts
   */
  static async getAllContacts(): Promise<Contact[]> {
    try {
      // Try to use cached contacts first
      const cached = this.getCachedContacts();
      if (cached) {
        return cached;
      }

      const response = await apiAdapter.get<Contact[]>('/api/contacts');
      const contacts = response.data || [];

      // Update cache
      this.contactsCache = contacts;
      this.cacheTimestamp = Date.now();

      return contacts;
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
      throw new AppError({
        message: 'Failed to load contacts',
        code: 'CONTACTS_FETCH_ERROR',
        userMessage: 'Unable to load your contacts. Please try again.',
        originalError: error as Error,
        retryable: true
      });
    }
  }

  /**
   * Get a specific contact by ID
   */
  static async getContactById(id: string): Promise<Contact> {
    try {
      validateRequired({ id }, ['id'], { id: 'Contact ID' });

      const response = await apiAdapter.get<Contact>(`/api/contacts/${id}`);
      if (!response.data) {
        throw new AppError({
          message: `Contact with ID ${id} not found`,
          code: 'CONTACT_NOT_FOUND',
          userMessage: 'The requested contact was not found.',
          retryable: false
        });
      }

      return response.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      
      console.error(`Failed to fetch contact ${id}:`, error);
      throw new AppError({
        message: 'Failed to load contact',
        code: 'CONTACT_FETCH_ERROR',
        userMessage: 'Unable to load the contact details. Please try again.',
        originalError: error as Error,
        retryable: true
      });
    }
  }

  /**
   * Create a new contact
   */
  static async createContact(contactData: NewContact): Promise<Contact> {
    try {
      validateRequired(contactData as unknown as Record<string, unknown>, ['name', 'email', 'timezone'], {
        name: 'Name',
        email: 'Email',
        timezone: 'Timezone'
      });

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactData.email)) {
        throw new AppError({
          message: 'Invalid email format',
          code: 'VALIDATION_ERROR',
          userMessage: 'Please enter a valid email address.',
          retryable: false
        });
      }

      console.log('👥 Creating contact via API:', {
        contactData,
        timestamp: new Date().toISOString()
      });
      
      const response = await apiAdapter.post<Contact>('/api/contacts', contactData);
      
      console.log('✅ Contact creation response:', {
        success: response.success,
        hasData: !!response.data,
        contactId: response.data?._id,
        wasExisting: (response.data as Record<string, unknown>)?.wasExisting
      });
      
      if (response.data) {
        // Handle case where existing contact was returned
        const responseData = response.data as Record<string, unknown>;
        const contact = (responseData.contact as Contact) || response.data;
        
        // Clear cache to ensure fresh data on next fetch
        this.clearCache();
        return contact;
      }

      throw new AppError({
        message: 'Failed to create contact - no data returned',
        code: 'CONTACT_CREATE_ERROR',
        userMessage: 'Failed to create the contact. Please try again.',
        retryable: true
      });

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      console.error('Failed to create contact:', error);
      throw new AppError({
        message: 'Failed to create contact',
        code: 'CONTACT_CREATE_ERROR',
        userMessage: 'Unable to create the contact. Please check your information and try again.',
        originalError: error as Error,
        retryable: true
      });
    }
  }

  /**
   * Update an existing contact
   */
  static async updateContact(id: string, contactData: Partial<NewContact>): Promise<Contact> {
    try {
      validateRequired({ id }, ['id'], { id: 'Contact ID' });

      // Validate email format if email is being updated
      if (contactData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contactData.email)) {
          throw new AppError({
            message: 'Invalid email format',
            code: 'VALIDATION_ERROR',
            userMessage: 'Please enter a valid email address.',
            retryable: false
          });
        }
      }

      const response = await apiAdapter.put<Contact>(`/api/contacts/${id}`, contactData);
      
      if (response.data) {
        // Clear cache to ensure fresh data on next fetch
        this.clearCache();
        return response.data;
      }

      throw new AppError({
        message: 'Failed to update contact - no data returned',
        code: 'CONTACT_UPDATE_ERROR',
        userMessage: 'Failed to update the contact. Please try again.',
        retryable: true
      });

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      console.error(`Failed to update contact ${id}:`, error);
      throw new AppError({
        message: 'Failed to update contact',
        code: 'CONTACT_UPDATE_ERROR',
        userMessage: 'Unable to update the contact. Please try again.',
        originalError: error as Error,
        retryable: true
      });
    }
  }

  /**
   * Delete a contact
   */
  static async deleteContact(id: string): Promise<void> {
    try {
      validateRequired({ id }, ['id'], { id: 'Contact ID' });

      await apiAdapter.delete(`/api/contacts/${id}`);
      
      // Clear cache to ensure fresh data on next fetch
      this.clearCache();

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      console.error(`Failed to delete contact ${id}:`, error);
      throw new AppError({
        message: 'Failed to delete contact',
        code: 'CONTACT_DELETE_ERROR',
        userMessage: 'Unable to delete the contact. Please try again.',
        originalError: error as Error,
        retryable: true
      });
    }
  }

  /**
   * Get contacts by status
   */
  static async getContactsByStatus(status: Contact['status']): Promise<Contact[]> {
    const contacts = await this.getAllContacts();
    return contacts.filter(contact => contact.status === status);
  }

  /**
   * Search contacts by name or email
   */
  static async searchContacts(query: string): Promise<Contact[]> {
    if (!query.trim()) {
      return this.getAllContacts();
    }

    const contacts = await this.getAllContacts();
    const searchQuery = query.toLowerCase().trim();
    
    return contacts.filter(contact => 
      contact.name.toLowerCase().includes(searchQuery) ||
      contact.email.toLowerCase().includes(searchQuery)
    );
  }

  /**
   * Get contacts count by status
   */
  static async getContactsStats(): Promise<Record<Contact['status'], number> & { total: number }> {
    try {
      // Try to get stats from backend first
      const response = await apiAdapter.get<Record<Contact['status'], number> & { total: number }>('/api/contacts/stats');
      if (response.data) {
        return response.data;
      }
    } catch (error) {
      console.warn('Failed to fetch contact stats from backend, calculating locally:', error);
    }

    // Fallback: calculate locally
    const contacts = await this.getAllContacts();
    const stats = {
      pending: 0,
      slots_generated: 0,
      email_sent: 0,
      scheduled: 0,
      completed: 0,
      total: contacts.length
    };

    contacts.forEach(contact => {
      stats[contact.status]++;
    });

    return stats;
  }

  /**
   * Bulk create contacts
   */
  static async createMultipleContacts(contactsData: NewContact[]): Promise<Contact[]> {
    try {
      if (!Array.isArray(contactsData) || contactsData.length === 0) {
        throw new AppError({
          message: 'No contacts provided',
          code: 'VALIDATION_ERROR',
          userMessage: 'Please provide at least one contact to create.',
          retryable: false
        });
      }

      // Validate all contacts before creating any
      contactsData.forEach((contact, index) => {
        validateRequired(contact as unknown as Record<string, unknown>, ['name', 'email', 'timezone'], {
          name: `Contact ${index + 1} Name`,
          email: `Contact ${index + 1} Email`,
          timezone: `Contact ${index + 1} Timezone`
        });

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contact.email)) {
          throw new AppError({
            message: `Invalid email format for contact ${index + 1}`,
            code: 'VALIDATION_ERROR',
            userMessage: `Please enter a valid email address for contact ${index + 1}.`,
            retryable: false
          });
        }
      });

      // Create contacts one by one (could be optimized with bulk API if available)
      const createdContacts: Contact[] = [];
      const errors: Array<{ index: number; error: string }> = [];

      for (let i = 0; i < contactsData.length; i++) {
        try {
          const contact = await this.createContact(contactsData[i]);
          createdContacts.push(contact);
        } catch (error) {
          const errorMessage = error instanceof AppError ? error.userMessage : 'Unknown error';
          errors.push({ index: i, error: errorMessage });
        }
      }

      if (errors.length > 0) {
        const errorMessages = errors.map(e => `Contact ${e.index + 1}: ${e.error}`).join('; ');
        throw new AppError({
          message: `Failed to create some contacts: ${errorMessages}`,
          code: 'BULK_CREATE_PARTIAL_ERROR',
          userMessage: `Some contacts could not be created: ${errorMessages}`,
          retryable: true
        });
      }

      return createdContacts;

    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      console.error('Failed to create multiple contacts:', error);
      throw new AppError({
        message: 'Failed to create contacts',
        code: 'BULK_CREATE_ERROR',
        userMessage: 'Unable to create the contacts. Please try again.',
        originalError: error as Error,
        retryable: true
      });
    }
  }
}

// Export singleton instance
export const contactsService = ContactsService;