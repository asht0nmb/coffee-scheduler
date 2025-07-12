'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { eventsService } from '@/services/eventsService';

export const GoogleCalendarMock = () => {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

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
    return eventsService.getUpcomingEvents(3);
  };

  const getEventsForCurrentWeek = () => {
    // Get events for current week (July 2025)
    const weekStart = new Date(2025, 6, 14); // July 14, 2025
    return eventsService.getEventsForWeek(weekStart);
  };

  return (
    <div 
      className="bg-white border border-secondary-200 rounded-lg min-h-[calc(100vh-8rem)] relative overflow-hidden transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Overlay - shown when NOT hovered */}
      <div 
        className={`absolute inset-0 bg-white/85 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300 ${
          isHovered ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="px-8 w-80">
          <h3 className="text-lg font-display font-semibold text-neutral-900 mb-6 text-center">
            Upcoming Events
          </h3>
          <div className="space-y-3">
            {getUpcomingEvents().map((event) => (
              <div 
                key={event.id} 
                className="bg-neutral-50 rounded-md p-3 border border-neutral-200 hover:bg-neutral-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate mb-1">
                      {event.title}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {formatDate(event.date)} at {formatTime(event.date)}
                    </p>
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-100 rounded-full">
                      <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actual Calendar - shown when hovered */}
      <div className={`p-4 h-full transition-opacity duration-300 ${
        isHovered ? 'opacity-100' : 'opacity-15'
      }`}>
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display font-semibold text-neutral-900">
            Week of July 14 - July 20, 2025
          </h3>
          
          <div className="flex items-center space-x-2">
            {/* Upcoming Events Button */}
            <button
              onClick={() => router.push('/dashboard/events?view=upcoming')}
              className="inline-flex items-center px-3 py-1 bg-primary-600 text-white text-xs font-medium rounded hover:bg-primary-700 transition-colors duration-200"
            >
              <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Upcoming
            </button>
            
            <button className="p-1 hover:bg-neutral-100 rounded cursor-pointer">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="p-1 hover:bg-neutral-100 rounded cursor-pointer">
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
            const dayEvents = getEventsForCurrentWeek().filter(event => 
              event.date.getDate() === dayNum && event.date.getMonth() === 6 // July
            );
            const hasEvent = dayEvents.length > 0;
            const event = dayEvents[0]; // Show first event if multiple
            
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