'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Event } from '@/types/events';
import { eventsService } from '@/services/eventsService';
import { EventDetails } from '@/components/events/event-details-modal';

type ViewMode = 'past' | 'upcoming';

export default function EventsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeView, setActiveView] = useState<ViewMode>('past');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // Check URL params to set initial view
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam === 'upcoming') {
      setActiveView('upcoming');
    } else if (viewParam === 'past') {
      setActiveView('past');
    }
    setIsMounted(true);
  }, [searchParams]);
  
  // Get events based on active view
  const pastEvents: Event[] = eventsService.getAllPastEvents();
  const upcomingEvents: Event[] = eventsService.getUpcomingEvents();
  
  const currentEvents = activeView === 'past' ? pastEvents : upcomingEvents;
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
    return activeView === 'past' ? 'Past Events' : 'Upcoming Events';
  };
  
  const getViewDescription = () => {
    return activeView === 'past' 
      ? 'View your completed and cancelled scheduling sessions'
      : 'View your scheduled upcoming meetings and events';
  };
  
  const handleViewDetails = (event: Event) => {
    console.log('View Details clicked for event:', event.id);
    console.log('Setting selectedEvent to:', event);
    setSelectedEvent(event);
  };
  
  // Debug selected event changes
  useEffect(() => {
    console.log('selectedEvent changed:', selectedEvent);
  }, [selectedEvent]);
  
  const handleCloseDetails = () => {
    setSelectedEvent(null);
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

      {/* Events List */}
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
                    onClick={() => {
                      console.log('Div clicked!', event.id);
                      handleViewDetails(event);
                    }}
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

      {/* Empty State (when no events) */}
      {currentEvents.length === 0 && (
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