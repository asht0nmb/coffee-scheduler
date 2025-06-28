'use client';

import { useState } from 'react';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'regular' | 'coffee_chat';
}

const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Team Sync',
    start: new Date(2025, 5, 30, 9, 0), // June 30, 9 AM
    end: new Date(2025, 5, 30, 10, 0),
    type: 'regular'
  },
  {
    id: '2',
    title: 'Coffee with John',
    start: new Date(2025, 6, 2, 14, 0), // July 2, 2 PM
    end: new Date(2025, 6, 2, 15, 0),
    type: 'coffee_chat'
  },
  {
    id: '3',
    title: 'Project Review',
    start: new Date(2025, 6, 3, 11, 0), // July 3, 11 AM
    end: new Date(2025, 6, 3, 12, 0),
    type: 'regular'
  }
];

export const GoogleCalendarMock = () => {
  const [isHovered, setIsHovered] = useState(false);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };


  const getUpcomingEvents = () => {
    return mockEvents.slice(0, 3);
  };

  return (
    <div 
      className="bg-white border border-secondary-200 rounded-lg h-96 relative overflow-hidden transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Overlay - shown when NOT hovered */}
      <div 
        className={`absolute inset-0 bg-white flex items-center justify-center transition-opacity duration-300 ${
          isHovered ? 'opacity-0 pointer-events-none' : 'opacity-80'
        }`}
      >
        <div className="text-center">
          <h3 className="text-lg font-display font-semibold text-neutral-900 mb-4">
            Upcoming Events
          </h3>
          <div className="space-y-2">
            {getUpcomingEvents().map((event) => (
              <div key={event.id} className="text-sm font-body text-neutral-600">
                • {event.title} - {formatDate(event.start)} at {formatTime(event.start)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actual Calendar - shown when hovered */}
      <div className={`p-4 h-full transition-opacity duration-300 ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`}>
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display font-semibold text-neutral-900">
            Week of June 29 - July 5, 2025
          </h3>
          <div className="flex space-x-2">
            <button className="p-1 hover:bg-neutral-100 rounded">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="p-1 hover:bg-neutral-100 rounded">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-neutral-200 rounded-lg overflow-hidden">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="bg-neutral-50 p-2 text-center text-xs font-medium text-neutral-600">
              {day}
            </div>
          ))}
          
          {/* Calendar Days */}
          {Array.from({ length: 42 }, (_, i) => {
            const dayNum = i - 28 + 1; // Adjust for current week
            const isCurrentMonth = dayNum > 0 && dayNum <= 31;
            const hasEvent = mockEvents.some(event => 
              event.start.getDate() === dayNum && event.start.getMonth() === 5
            );
            const event = mockEvents.find(e => e.start.getDate() === dayNum && e.start.getMonth() === 5);
            
            return (
              <div key={i} className={`bg-white p-2 min-h-16 ${
                isCurrentMonth ? 'text-neutral-900' : 'text-neutral-300'
              }`}>
                <div className="text-xs font-medium mb-1">{isCurrentMonth ? dayNum : ''}</div>
                {hasEvent && event && (
                  <div className={`text-xs p-1 rounded text-white truncate ${
                    event.type === 'coffee_chat' 
                      ? 'bg-purple-500' 
                      : 'bg-primary-500'
                  }`}>
                    {event.title}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};