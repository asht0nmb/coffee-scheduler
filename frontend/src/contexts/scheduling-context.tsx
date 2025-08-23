'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { NewContact } from '@/lib/types';
import { SchedulingService } from '@/services/schedulingService';
import { PendingEventsService, PendingEvent } from '@/services/pendingEventsService';

interface SchedulingSessionData {
  sessionId: string;
  contacts: NewContact[];
  duration: number;
  participants: Array<{
    id: string;
    name: string;
    timezone: string;
    email?: string;
    timeSlots: string[];
  }>;
  metadata?: {
    algorithm: string;
    totalContacts: number;
    successfullyScheduled: number;
    confirmedEvents?: PendingEvent[];
    blockedSlots?: string[];
  };
  selectedSlots?: Array<{
    contactId: string;
    selectedSlot: string;
    alternateSlots?: string[];
  }>;
  createdAt: string;
}

interface SchedulingContextType {
  // Current session state
  currentSession: SchedulingSessionData | null;
  isLoading: boolean;
  error: string | null;
  
  // Session management
  createSession: (contacts: NewContact[], duration: number) => Promise<string>;
  loadSession: (sessionId: string) => Promise<SchedulingSessionData | null>;
  updateSession: (sessionId: string, updates: Partial<SchedulingSessionData>) => void;
  clearSession: () => void;
  
  // Slot selection management
  selectSlot: (contactId: string, slot: string) => void;
  removeSlotSelection: (contactId: string) => void;
  getSelectedSlots: () => Array<{ contactId: string; selectedSlot: string }>;
  
  // Confirmation workflow
  confirmScheduling: (sessionId: string) => Promise<void>;
  
  // Pending events management
  pendingEvents: PendingEvent[];
  loadPendingEvents: () => Promise<void>;
  clearPendingEvent: (eventId: string) => Promise<void>;
  
  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;
}

const SchedulingContext = createContext<SchedulingContextType | undefined>(undefined);

export const useScheduling = () => {
  const context = useContext(SchedulingContext);
  if (context === undefined) {
    throw new Error('useScheduling must be used within a SchedulingProvider');
  }
  return context;
};

interface SchedulingProviderProps {
  children: ReactNode;
}

export const SchedulingProvider = ({ children }: SchedulingProviderProps) => {
  const [currentSession, setCurrentSession] = useState<SchedulingSessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingEvents, setPendingEvents] = useState<PendingEvent[]>([]);

  // Create new scheduling session
  const createSession = async (contacts: NewContact[], duration: number): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if backend is available
      const backendAvailable = await SchedulingService.checkBackendHealth();
      let sessionData;
      
      if (backendAvailable) {
        // Use real backend
        sessionData = await SchedulingService.createSchedulingSession(contacts, duration);
      } else {
        // Fallback to mock data
        console.warn('Backend unavailable, using mock data');
        sessionData = SchedulingService.generateMockSchedulingData(contacts);
      }

      // Create full session object
      const fullSession: SchedulingSessionData = {
        ...sessionData,
        contacts,
        duration,
        selectedSlots: [],
        createdAt: new Date().toISOString()
      };

      // Save session to state and storage
      setCurrentSession(fullSession);
      SchedulingService.saveSchedulingSession(sessionData.sessionId, fullSession);
      
      return sessionData.sessionId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create scheduling session';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Load existing session
  const loadSession = async (sessionId: string): Promise<SchedulingSessionData | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First try to load from localStorage
      let sessionData = SchedulingService.loadSchedulingSession(sessionId);
      
      if (!sessionData) {
        // If not in localStorage, try backend
        sessionData = await SchedulingService.getSchedulingSession(sessionId);
      }
      
      if (sessionData) {
        // Transform SessionData to SchedulingSessionData format
        const transformedData: SchedulingSessionData = {
          sessionId: sessionData.sessionId,
          contacts: [], // Will be populated separately
          duration: sessionData.duration,
          participants: sessionData.participants,
          createdAt: new Date().toISOString() // Add missing field
        };
        setCurrentSession(transformedData);
        return transformedData;
      } else {
        setError('Scheduling session not found');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load scheduling session';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Update session data
  const updateSession = (sessionId: string, updates: Partial<SchedulingSessionData>) => {
    if (currentSession && currentSession.sessionId === sessionId) {
      const updatedSession = { ...currentSession, ...updates };
      setCurrentSession(updatedSession);
      SchedulingService.saveSchedulingSession(sessionId, updatedSession);
    }
  };

  // Clear current session
  const clearSession = () => {
    setCurrentSession(null);
    setError(null);
  };

  // Select a time slot for a contact
  const selectSlot = (contactId: string, slot: string) => {
    if (!currentSession) return;
    
    const updatedSlots = [
      ...(currentSession.selectedSlots || []).filter(s => s.contactId !== contactId),
      { contactId, selectedSlot: slot }
    ];
    
    updateSession(currentSession.sessionId, { selectedSlots: updatedSlots });
  };

  // Remove slot selection for a contact
  const removeSlotSelection = (contactId: string) => {
    if (!currentSession) return;
    
    const updatedSlots = (currentSession.selectedSlots || []).filter(s => s.contactId !== contactId);
    updateSession(currentSession.sessionId, { selectedSlots: updatedSlots });
  };

  // Get all selected slots
  const getSelectedSlots = () => {
    return currentSession?.selectedSlots?.map(s => ({
      contactId: s.contactId,
      selectedSlot: s.selectedSlot
    })) || [];
  };

  // Confirm scheduling and create pending events
  const confirmScheduling = async (sessionId: string) => {
    if (!currentSession || !currentSession.selectedSlots) {
      throw new Error('No session or slots selected');
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Transform selected slots to pending event format
      const pendingEventRequests = currentSession.selectedSlots.map(selection => {
        const participant = currentSession.participants?.find(p => p.id === selection.contactId);
        return {
          sessionId,
          contactName: participant?.name || 'Unknown Contact',
          contactEmail: participant?.email,
          selectedSlot: selection.selectedSlot,
          timezone: participant?.timezone || 'America/New_York',
          duration: currentSession.duration
        };
      });

      // Create pending events via API
      const result = await PendingEventsService.createPendingEvents(pendingEventRequests);
      
      // Update session with confirmation data
      updateSession(sessionId, {
        selectedSlots: [], // Clear selections after confirmation
        metadata: {
          algorithm: currentSession.metadata?.algorithm || 'confirmed',
          totalContacts: currentSession.metadata?.totalContacts || currentSession.participants?.length || 0,
          successfullyScheduled: currentSession.metadata?.successfullyScheduled || currentSession.participants?.length || 0,
          confirmedEvents: result.created,
          blockedSlots: result.blocked
        }
      });

      // Refresh pending events list
      await loadPendingEvents();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to confirm scheduling';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Load pending events for current user
  const loadPendingEvents = async () => {
    try {
      const events = await PendingEventsService.getPendingEvents();
      setPendingEvents(events);
    } catch (err) {
      console.error('Failed to load pending events:', err);
      // Don't throw error here, just log it as this is background loading
    }
  };

  // Clear a specific pending event
  const clearPendingEvent = async (eventId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await PendingEventsService.clearPendingEvent(eventId);
      
      // Remove from local state
      setPendingEvents(prev => prev.filter(event => event.id !== eventId));
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear pending event';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Error management
  const handleSetError = (error: string | null) => {
    setError(error);
  };

  const clearError = () => {
    setError(null);
  };

  // Auto-load session on mount if available in URL
  useEffect(() => {
    // This could be enhanced to auto-load from URL params
    // For now, sessions are loaded explicitly by pages
  }, []);

  const value = {
    currentSession,
    isLoading,
    error,
    createSession,
    loadSession,
    updateSession,
    clearSession,
    selectSlot,
    removeSlotSelection,
    getSelectedSlots,
    confirmScheduling,
    pendingEvents,
    loadPendingEvents,
    clearPendingEvent,
    setError: handleSetError,
    clearError,
  };

  return (
    <SchedulingContext.Provider value={value}>
      {children}
    </SchedulingContext.Provider>
  );
};

// Hook for checking if a session is valid/complete
export const useSchedulingValidation = () => {
  const { currentSession } = useScheduling();
  
  return {
    hasValidSession: !!currentSession,
    hasParticipants: !!currentSession?.participants?.length,
    hasSelections: !!currentSession?.selectedSlots?.length,
    isReadyForConfirmation: !!(
      currentSession?.participants?.length && 
      currentSession?.selectedSlots?.length &&
      currentSession.selectedSlots.length === currentSession.participants.length
    )
  };
};