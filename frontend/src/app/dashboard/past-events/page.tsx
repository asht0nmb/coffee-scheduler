'use client';

import { Event } from '@/types/events';
import { eventsService } from '@/services/eventsService';

export default function PastEventsPage() {
  // Get all past events from service
  const pastEvents: Event[] = eventsService.getAllPastEvents();
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

  const getStatusBadge = (status: string) => {
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

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <button 
            onClick={() => window.history.back()}
            className="text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-display font-bold text-neutral-900">
            Past Events
          </h1>
        </div>
        <p className="font-body text-neutral-600">
          View your completed and cancelled scheduling sessions
        </p>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {pastEvents.map((event) => (
          <div 
            key={event.id}
            className="bg-white border border-secondary-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            {/* Event Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-display font-semibold text-neutral-900 mb-1">
                  {event.title}
                </h3>
                <p className="text-sm font-body text-neutral-600">
                  {formatDate(event.date)} at {formatTime(event.date)}
                </p>
              </div>
              <div>
                {getStatusBadge(event.status)}
              </div>
            </div>

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Final Time Slot */}
              <div>
                <h4 className="text-sm font-medium text-neutral-700 mb-1">Final Time</h4>
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

              {/* Participants Count */}
              <div>
                <h4 className="text-sm font-medium text-neutral-700 mb-1">Participants</h4>
                <p className="text-sm font-body text-neutral-900">
                  {event.participants.length} people
                </p>
              </div>
            </div>

            {/* Participants List */}
            <div className="mt-4">
              <h4 className="text-sm font-medium text-neutral-700 mb-2">Who attended:</h4>
              <div className="flex flex-wrap gap-2">
                {event.participants.map((participant, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800"
                  >
                    • {participant}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <div className="flex space-x-3">
                <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  📋 View Details
                </button>
                {event.status === 'completed' && (
                  <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    🔄 Schedule Again
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State (when no events) */}
      {pastEvents.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-display font-semibold text-neutral-900 mb-2">
            No Past Events
          </h3>
          <p className="font-body text-neutral-600 mb-4">
            Your completed scheduling sessions will appear here
          </p>
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 border border-primary-300 rounded-md text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}