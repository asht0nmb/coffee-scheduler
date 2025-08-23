'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Event } from '@/types/events';
import { eventsService } from '@/services/eventsService';
import { EventDetails } from '@/components/events/event-details-modal';
import { useScheduling } from '@/contexts/scheduling-context';
import { PendingEvent } from '@/services/pendingEventsService';
import { Button } from '@/components/ui/button';

type ViewMode = 'past' | 'upcoming' | 'pending';

function EventsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeView, setActiveView] = useState<ViewMode>('past');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [processingEventId, setProcessingEventId] = useState<string | null>(null);
  
  const { 
    pendingEvents, 
    loadPendingEvents, 
    clearPendingEvent, 
    error: pendingError 
  } = useScheduling();
  
  // Check URL params to set initial view
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam === 'upcoming') {
      setActiveView('upcoming');
    } else if (viewParam === 'past') {
      setActiveView('past');
    } else if (viewParam === 'pending') {
      setActiveView('pending');
    }
    setIsMounted(true);
  }, [searchParams]);
  
  // Load pending events when pending view is selected
  useEffect(() => {
    if (activeView === 'pending') {
      loadPendingEvents().catch(err => {
        console.error('Failed to load pending events:', err);
      });
    }
  }, [activeView, loadPendingEvents]);
  
  // State for events data
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  
  // Load events based on active view
  useEffect(() => {
    const loadEvents = async () => {
      if (activeView === 'pending') return; // Pending events handled separately
      
      setIsLoadingEvents(true);
      try {
        if (activeView === 'past') {
          const events = await eventsService.getAllPastEvents();
          setPastEvents(events);
        } else if (activeView === 'upcoming') {
          const events = await eventsService.getUpcomingEvents();
          setUpcomingEvents(events);
        }
      } catch (error) {
        console.error('Failed to load events:', error);
        // TODO: Show error toast or notification
      } finally {
        setIsLoadingEvents(false);
      }
    };

    loadEvents();
  }, [activeView]);
  
  const currentEvents = activeView === 'past' ? pastEvents : activeView === 'upcoming' ? upcomingEvents : [];
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusBadge = (status: string, isUpcoming: boolean = false) => {
    if (isUpcoming && status === 'scheduled') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          📅 Scheduled
        </span>
      );
    }
    
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✓ Completed
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          ✗ Cancelled
        </span>
      );
    }
  };
  
  const getViewTitle = () => {
    return activeView === 'past' ? 'Past Events' : activeView === 'upcoming' ? 'Upcoming Events' : 'Pending Events';
  };
  
  const getViewDescription = () => {
    return activeView === 'past' 
      ? 'View your completed and cancelled scheduling sessions'
      : activeView === 'upcoming'
      ? 'View your scheduled upcoming meetings and events'
      : 'These are confirmed time slots that are currently blocking your calendar for new scheduling.';
  };
  
  const handleViewDetails = (event: Event) => {
    setSelectedEvent(event);
  };
  
  const handleCloseDetails = () => {
    setSelectedEvent(null);
  };

  // Pending events handlers
  const handleClearPendingEvent = async (eventId: string, contactName: string) => {
    const confirmed = confirm(`Cancel the pending meeting with ${contactName}? This will free up the time slot for future scheduling.`);
    
    if (!confirmed) return;
    
    setProcessingEventId(eventId);
    
    try {
      await clearPendingEvent(eventId);
    } catch (err) {
      console.error('Failed to clear pending event:', err);
      alert('Failed to cancel the pending event. Please try again.');
    } finally {
      setProcessingEventId(null);
    }
  };

  const formatTimeSlot = (event: PendingEvent) => {
    const createdDate = new Date(event.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    
    return `${event.timeSlot} (confirmed ${createdDate})`;
  };

  const getStatusColor = (status: PendingEvent['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <button 
            onClick={() => router.push('/dashboard')}
            className="text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-display font-bold text-neutral-900">
            {getViewTitle()}
          </h1>
        </div>
        <p className="font-body text-neutral-600">
          {getViewDescription()}
        </p>
      </div>

      {/* Tab Slider with Info Button */}
      <div className="mb-6 relative">
        <div className="bg-neutral-100 p-1 rounded-lg inline-flex">
          <button
            onClick={() => router.push('/dashboard/events?view=past')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
              activeView === 'past'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Past Events
          </button>
          <button
            onClick={() => router.push('/dashboard/events?view=upcoming')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
              activeView === 'upcoming'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Upcoming Events
          </button>
          <button
            onClick={() => router.push('/dashboard/events?view=pending')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
              activeView === 'pending'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Pending Events
          </button>
        </div>
        
        {/* Info Hover Button - positioned to align with status tags */}
        <div className="absolute top-0 right-0 group">
          <button className="w-5 h-5 rounded-full bg-neutral-300 hover:bg-neutral-400 flex items-center justify-center text-white text-xs font-medium transition-colors duration-200 cursor-pointer">
            i
          </button>
          
          {/* Hover Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 w-56 p-2 bg-neutral-600 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
            <div className="text-center">
              Scheduling tag based off of Google Calendar
            </div>
            {/* Arrow */}
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-600"></div>
          </div>
        </div>
      </div>

      {/* Error State for Pending Events */}
      {activeView === 'pending' && pendingError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="text-red-500 mr-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
              </svg>
            </div>
            <p className="text-red-700">{pendingError}</p>
          </div>
        </div>
      )}

      {/* Pending Events List */}
      {activeView === 'pending' && (
        <div className="space-y-4">
          {pendingEvents.map((event) => (
            <div 
              key={event.id}
              className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-display font-semibold text-neutral-900">
                      Meeting with {event.contactName}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                      {event.status}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-neutral-600">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{formatTimeSlot(event)}</span>
                    </div>
                    
                    {event.contactEmail && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                        <span>{event.contactEmail}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{event.duration} minutes • {event.timezone}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  {event.status === 'pending' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          alert('Add to Calendar feature coming soon!');
                        }}
                      >
                        📅 Add to Calendar
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClearPendingEvent(event.id, event.contactName)}
                        disabled={processingEventId === event.id}
                      >
                        {processingEventId === event.id ? 'Cancelling...' : '❌ Cancel'}
                      </Button>
                    </>
                  )}
                  
                  {event.status === 'scheduled' && (
                    <span className="text-sm text-green-600 font-medium">
                      ✓ Added to Calendar
                    </span>
                  )}
                  
                  {event.status === 'cancelled' && (
                    <span className="text-sm text-red-600 font-medium">
                      ❌ Cancelled
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading State */}
      {isLoadingEvents && activeView !== 'pending' && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-neutral-600">Loading events...</span>
        </div>
      )}

      {/* Events List */}
      {!isLoadingEvents && activeView !== 'pending' && (
        <div className="space-y-4">
          {currentEvents.map((event) => (
          <div 
            key={event.id}
            className="bg-white border border-secondary-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            {/* Event Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-display font-semibold text-neutral-900 mb-1">
                  {event.participants[0] || 'Coffee Chat'}
                </h3>
                <p className="text-sm font-body text-neutral-600">
                  {formatDate(event.date)} at {formatTime(event.date)}
                </p>
              </div>
              <div>
                {getStatusBadge(event.status, activeView === 'upcoming')}
              </div>
            </div>

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Final Time Slot */}
              <div>
                <h4 className="text-sm font-medium text-neutral-700 mb-1">
                  {activeView === 'upcoming' ? 'Scheduled Time' : 'Final Time'}
                </h4>
                <p className="text-sm font-body text-neutral-900 bg-primary-50 text-primary-700 px-2 py-1 rounded">
                  {event.finalTimeSlot}
                </p>
              </div>

              {/* Duration */}
              <div>
                <h4 className="text-sm font-medium text-neutral-700 mb-1">Duration</h4>
                <p className="text-sm font-body text-neutral-900">
                  {event.duration} minutes
                </p>
              </div>
            </div>


            {/* Actions */}
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <div className="flex space-x-3">
                {isMounted && (
                  <div 
                    onClick={() => handleViewDetails(event)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleViewDetails(event);
                      }
                    }}
                    className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium cursor-pointer transition-colors duration-200 py-1 px-2 rounded hover:bg-primary-50"
                  >
                    📋 View Details
                  </div>
                )}
                {activeView === 'upcoming' && event.status === 'scheduled' && (
                  <button className="text-sm text-orange-600 hover:text-orange-700 font-medium cursor-pointer">
                    ✏️ Edit Meeting
                  </button>
                )}
                {activeView === 'upcoming' && event.status === 'scheduled' && (
                  <button className="text-sm text-red-600 hover:text-red-700 font-medium cursor-pointer">
                    ❌ Cancel Meeting
                  </button>
                )}
                {activeView === 'past' && event.status === 'completed' && (
                  <button className="text-sm text-primary-600 hover:text-primary-700 font-medium cursor-pointer">
                    🔄 Schedule Again
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Empty State (when no events) */}
      {activeView === 'pending' && pendingEvents.length === 0 && !pendingError && (
        <div className="text-center py-12">
          <div className="text-neutral-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Pending Events</h3>
          <p className="text-neutral-600 mb-4">
            You don&apos;t have any confirmed time slots waiting to be scheduled.
          </p>
          <Button onClick={() => router.push('/dashboard')}>
            Schedule New Meeting
          </Button>
        </div>
      )}

      {!isLoadingEvents && activeView !== 'pending' && currentEvents.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">
            {activeView === 'upcoming' ? '🗓️' : '📅'}
          </div>
          <h3 className="text-xl font-display font-semibold text-neutral-900 mb-2">
            {activeView === 'upcoming' ? 'No Upcoming Events' : 'No Past Events'}
          </h3>
          <p className="font-body text-neutral-600 mb-4">
            {activeView === 'upcoming' 
              ? 'Your scheduled meetings will appear here'
              : 'Your completed scheduling sessions will appear here'
            }
          </p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center px-4 py-2 border border-primary-300 rounded-md text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors cursor-pointer"
          >
            ← Back to Dashboard
          </button>
        </div>
      )}

      {/* Statistics for Pending Events */}
      {activeView === 'pending' && pendingEvents.length > 0 && (
        <div className="mt-8 p-4 bg-neutral-50 rounded-lg">
          <h4 className="font-medium text-neutral-900 mb-2">Summary</h4>
          <div className="text-sm text-neutral-600 space-y-1">
            <div>Total pending events: {pendingEvents.filter(e => e.status === 'pending').length}</div>
            <div>Scheduled events: {pendingEvents.filter(e => e.status === 'scheduled').length}</div>
            <div>Cancelled events: {pendingEvents.filter(e => e.status === 'cancelled').length}</div>
          </div>
        </div>
      )}

      {/* Event Details */}
      {selectedEvent && (
        <div className="mt-6">
          <p className="text-sm text-red-500 mb-2">DEBUG: Event Details should render here for event ID: {selectedEvent.id}</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p>Simple test div - Event ID: {selectedEvent.id}</p>
            <p>Event Title: {selectedEvent.title}</p>
            <p>Participant: {selectedEvent.participants[0]}</p>
            <button 
              onClick={handleCloseDetails}
              className="mt-2 px-3 py-1 bg-red-500 text-white rounded cursor-pointer"
            >
              Close Test
            </button>
          </div>
          <EventDetails
            event={selectedEvent}
            onClose={handleCloseDetails}
          />
        </div>
      )}
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="px-4 py-6">Loading...</div>}>
      <EventsPageContent />
    </Suspense>
  );
}