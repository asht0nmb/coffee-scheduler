'use client';

import { useEffect } from 'react';
import { Event } from '@/types/events';

interface EventDetailsProps {
  event: Event | null;
  onClose: () => void;
}

export const EventDetails = ({ event, onClose }: EventDetailsProps) => {
  
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  if (!event) {
    return null;
  }

  // Extract contact info (using first participant as primary contact)
  const contactName = event.participants[0] || 'Unknown Contact';
  const contactEmail = event.contactEmail || 'No email provided'; // Use real contact email
  const contactTimezone = event.contactTimezone || 'UTC'; // Use real contact timezone

  // Mock the three time slots that were sent (including the final one)
  const sentTimeSlots = [
    event.finalTimeSlot, // The one that was scheduled
    'Tue 10-11am',      // Mock alternative 1
    'Wed 3-4pm'         // Mock alternative 2
  ];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-xl font-display font-semibold text-neutral-900">
            Event Details
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Event Overview */}
          <div className="mb-6">
            <h3 className="text-lg font-display font-semibold text-neutral-900 mb-2">
              Coffee Chat with {contactName}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-neutral-600">
              <span>{formatDate(event.date)} at {formatTime(event.date)}</span>
              <span>•</span>
              <span>{event.duration} minutes</span>
              <span>•</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                event.status === 'completed' ? 'bg-green-100 text-green-800' :
                event.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {event.status === 'completed' ? '✓ Completed' :
                 event.status === 'cancelled' ? '✗ Cancelled' :
                 '📅 Scheduled'}
              </span>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-6">
            <h4 className="text-md font-display font-semibold text-neutral-900 mb-3">
              Contact Information
            </h4>
            <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {contactName.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-medium text-neutral-900">{contactName}</p>
                  <p className="text-sm text-neutral-600">{contactEmail}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-neutral-200">
                <p className="text-sm text-neutral-600">
                  <span className="font-medium">Timezone:</span> {contactTimezone}
                </p>
              </div>
            </div>
          </div>

          {/* Time Slots Sent */}
          <div className="mb-6">
            <h4 className="text-md font-display font-semibold text-neutral-900 mb-3">
              Time Options Sent
            </h4>
            <div className="space-y-2">
              {sentTimeSlots.map((timeSlot, index) => {
                const isScheduled = timeSlot === event.finalTimeSlot;
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isScheduled
                        ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                        : 'bg-neutral-50 border-neutral-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${
                        isScheduled ? 'text-blue-900' : 'text-neutral-900'
                      }`}>
                        {timeSlot}
                      </span>
                      {isScheduled && (
                        <span className="inline-flex items-center px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">
                          ✓ Scheduled
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Meeting Notes (if any) */}
          <div className="mb-6">
            <h4 className="text-md font-display font-semibold text-neutral-900 mb-3">
              Notes
            </h4>
            <div className="bg-neutral-50 rounded-lg p-4">
              <p className="text-sm text-neutral-600 italic">
                {event.status === 'completed' 
                  ? 'Great conversation about career development and team collaboration.'
                  : event.status === 'cancelled'
                  ? 'Meeting was cancelled due to scheduling conflicts.'
                  : 'Looking forward to our coffee chat!'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-neutral-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
          {event.status === 'completed' && (
            <button className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors cursor-pointer">
              Schedule Again
            </button>
          )}
          {event.status === 'scheduled' && (
            <>
              <button className="px-4 py-2 text-sm font-medium text-orange-700 bg-orange-100 hover:bg-orange-200 rounded-lg transition-colors cursor-pointer">
                Edit Details
              </button>
              <button className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors cursor-pointer">
                Delete Meeting
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};