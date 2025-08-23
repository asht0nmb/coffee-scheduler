'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { EventSummary } from '@/types/events';
import { eventsService } from '@/services/eventsService';
import { 
  TIMEZONE_OPTIONS, 
  DURATION_OPTIONS,
  DEFAULT_TIMEZONE,
  DEFAULT_VALUES,
  APP_CONSTANTS 
} from '@/constants';

interface SidebarMenuProps {
  onNewEvent?: () => void;
}


interface PreferenceItem {
  id: string;
  label: string;
  description: string;
  type: 'select' | 'time-range';
  value?: string;
  icon: string;
  options?: { value: string; label: string }[];
  startTime?: string;
  endTime?: string;
}



// Transform duration options to match expected format
const sidebarDurationOptions = DURATION_OPTIONS.map(option => ({
  value: option.value.toString(),
  label: option.label
}));

// Mock preferences data
const mockPreferences: PreferenceItem[] = [
  {
    id: '1',
    label: 'Work Hours',
    description: '',
    type: 'time-range',
    icon: '⏰',
    startTime: DEFAULT_VALUES.WORKING_HOURS.START,
    endTime: DEFAULT_VALUES.WORKING_HOURS.END
  },
  {
    id: '2',
    label: 'Time Zone',
    description: '',
    type: 'select',
    value: DEFAULT_TIMEZONE,
    icon: '🌍',
    options: TIMEZONE_OPTIONS
  },
  {
    id: '3',
    label: 'Default Duration',
    description: '',
    type: 'select',
    value: DEFAULT_VALUES.DURATION.toString(),
    icon: '⏱️',
    options: sidebarDurationOptions
  }
];

export const SidebarMenu = ({ onNewEvent }: SidebarMenuProps) => {
  const router = useRouter();
  const [isPastEventsExpanded, setIsPastEventsExpanded] = useState(false);
  const [isPreferencesExpanded, setIsPreferencesExpanded] = useState(false);
  const [preferences, setPreferences] = useState(mockPreferences);
  
  // State for recent events
  const [recentEvents, setRecentEvents] = useState<EventSummary[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);

  // Load recent events from service
  useEffect(() => {
    const loadRecentEvents = async () => {
      setIsLoadingEvents(true);
      try {
        const events = await eventsService.getRecentEvents(6);
        setRecentEvents(events);
      } catch (error) {
        console.error('Failed to load recent events:', error);
        setRecentEvents([]); // Fallback to empty array
      } finally {
        setIsLoadingEvents(false);
      }
    };

    loadRecentEvents();
  }, []);

  const handlePastEventsToggle = () => {
    setIsPastEventsExpanded(!isPastEventsExpanded);
  };

  const handlePreferencesToggle = () => {
    setIsPreferencesExpanded(!isPreferencesExpanded);
  };

  const handlePreferenceChange = (preferenceId: string, newValue: string) => {
    setPreferences(prev => prev.map(pref => {
      if (pref.id === preferenceId) {
        const option = pref.options?.find(opt => opt.value === newValue);
        return {
          ...pref,
          value: newValue,
          description: option?.label || newValue
        };
      }
      return pref;
    }));
  };

  const handleTimeChange = (preferenceId: string, timeType: 'start' | 'end', newTime: string) => {
    setPreferences(prev => prev.map(pref => {
      if (pref.id === preferenceId) {
        const updatedPref = { ...pref };
        if (timeType === 'start') {
          updatedPref.startTime = newTime;
        } else {
          updatedPref.endTime = newTime;
        }
        
        // Don't update description for work hours - keep it empty
        return updatedPref;
      }
      return pref;
    }));
  };

  return (
    <div className="bg-white border border-secondary-200 rounded-lg p-4 h-auto lg:h-[calc(100vh-8rem)] flex flex-col">
      <h3 className="text-lg font-display font-semibold text-neutral-900 mb-4">
        {APP_CONSTANTS.MENU_TITLE}
      </h3>
      
      {/* Fixed header section - always visible */}
      <div className="flex-shrink-0 mb-3">
        <Button 
          onClick={onNewEvent}
          className="w-full justify-start"
          size="sm"
        >
          {APP_CONSTANTS.CTA_NEW_EVENT}
        </Button>
      </div>
      
      {/* Scrollable content area - contains all expandable sections */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {/* Past Events Section */}
        <div className="flex-shrink-0">
          <button 
            onClick={handlePastEventsToggle}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-body text-neutral-700 hover:bg-neutral-50 rounded-md transition-colors cursor-pointer"
          >
            <span className="flex items-center">
              📅 Past Events
            </span>
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${
                isPastEventsExpanded ? 'rotate-180' : ''
              }`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Past Events List - expands within scrollable area */}
          {isPastEventsExpanded && (
            <div className="mt-2 space-y-2">
              {isLoadingEvents ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-neutral-200 rounded"></div>
                  ))}
                </div>
              ) : recentEvents.length > 0 ? (
                recentEvents.map((event) => (
                <div 
                  key={event.id}
                  className="bg-neutral-50 rounded-md p-3 border border-neutral-200 hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {event.participantName}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {event.date} at {event.time}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      {event.completed ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-green-100 rounded-full">
                          <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-yellow-100 rounded-full">
                          <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                ))) : (
                <div className="text-center text-neutral-500 text-sm py-4">
                  No recent events
                </div>
              )}
              
              {/* View All Button */}
              {!isLoadingEvents && (
                <Button
                  onClick={() => router.push('/dashboard/events?view=past')}
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                >
                  View All Past Events
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* Preferences Section */}
        <div className="flex-shrink-0">
          <button 
            onClick={handlePreferencesToggle}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-body text-neutral-700 hover:bg-neutral-50 rounded-md transition-colors cursor-pointer"
          >
            <span className="flex items-center">
              ⚙️ Preferences
            </span>
            <svg 
              className={`w-4 h-4 transition-transform duration-200 ${
                isPreferencesExpanded ? 'rotate-180' : ''
              }`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Preferences List - expands within scrollable area */}
          {isPreferencesExpanded && (
            <div className="mt-2 space-y-2">
              {preferences.map((preference) => (
                <div 
                  key={preference.id}
                  className="bg-neutral-50 rounded-md p-3 border border-neutral-200 hover:bg-neutral-100 transition-colors"
                >
                  {preference.type === 'time-range' ? (
                    // Layout for work hours
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{preference.icon}</span>
                        <p className="text-sm font-medium text-neutral-900">
                          {preference.label}
                        </p>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <input
                          type="time"
                          value={preference.startTime || ''}
                          onChange={(e) => handleTimeChange(preference.id, 'start', e.target.value)}
                          className="text-xs bg-white border border-neutral-300 rounded px-1.5 py-0.5 w-25 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-sm text-neutral-400">-</span>
                        <input
                          type="time"
                          value={preference.endTime || ''}
                          onChange={(e) => handleTimeChange(preference.id, 'end', e.target.value)}
                          className="text-xs bg-white border border-neutral-300 rounded px-1.5 py-0.5 w-25 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  ) : (
                    // Layout for other preferences (timezone, duration)
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{preference.icon}</span>
                        <p className="text-sm font-medium text-neutral-900">
                          {preference.label}
                        </p>
                      </div>
                      <div className="flex justify-center">
                        {preference.type === 'select' && preference.options && (
                          <select
                            value={preference.value || ''}
                            onChange={(e) => handlePreferenceChange(preference.id, e.target.value)}
                            className="text-xs bg-white border border-neutral-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {preference.options.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};