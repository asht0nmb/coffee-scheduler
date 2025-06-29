'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface SidebarMenuProps {
  onNewEvent?: () => void;
}

interface PastEvent {
  id: string;
  participantName: string;
  date: string;
  time: string;
  completed: boolean;
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

// Mock past events data
const mockPastEvents: PastEvent[] = [
  {
    id: '1',
    participantName: 'John Smith',
    date: 'Jun 15, 2025',
    time: '2:00 PM',
    completed: true
  },
  {
    id: '2',
    participantName: 'Sarah Johnson',
    date: 'Jun 12, 2025',
    time: '10:30 AM',
    completed: true
  },
  {
    id: '3',
    participantName: 'Mike Chen',
    date: 'Jun 8, 2025',
    time: '3:15 PM',
    completed: false
  },
  {
    id: '4',
    participantName: 'Emily Davis',
    date: 'Jun 5, 2025',
    time: '11:00 AM',
    completed: true
  },
  {
    id: '5',
    participantName: 'Alex Wilson',
    date: 'May 28, 2025',
    time: '4:30 PM',
    completed: true
  },
  {
    id: '5',
    participantName: 'Alex Wilson',
    date: 'May 28, 2025',
    time: '4:30 PM',
    completed: true
  },
  {
    id: '5',
    participantName: 'Alex Wilson',
    date: 'May 28, 2025',
    time: '4:30 PM',
    completed: true
  },
  {
    id: '5',
    participantName: 'Alex Wilson',
    date: 'May 28, 2025',
    time: '4:30 PM',
    completed: true
  },
  {
    id: '6',
    participantName: 'Lisa Brown',
    date: 'May 25, 2025',
    time: '1:45 PM',
    completed: false
  }
];

// Timezone options with US timezones first
const timezoneOptions = [
  // US Timezones
  { value: 'America/New_York', label: 'Eastern Time (EST/EDT)' },
  { value: 'America/Chicago', label: 'Central Time (CST/CDT)' },
  { value: 'America/Denver', label: 'Mountain Time (MST/MDT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PST/PDT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKST/AKDT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
  // International
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Europe/Rome', label: 'Rome (CET/CEST)' },
  { value: 'Europe/Madrid', label: 'Madrid (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Seoul', label: 'Seoul (KST)' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Mumbai', label: 'Mumbai (IST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEDT/AEST)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZDT/NZST)' },
  { value: 'America/Toronto', label: 'Toronto (EST/EDT)' },
  { value: 'America/Vancouver', label: 'Vancouver (PST/PDT)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)' },
  { value: 'America/Mexico_City', label: 'Mexico City (CST/CDT)' }
];

// Duration options
const durationOptions = [
  { value: '15', label: '15 minutes' },
  { value: '20', label: '20 minutes' },
  { value: '25', label: '25 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '1 hour' }
];

// Mock preferences data
const mockPreferences: PreferenceItem[] = [
  {
    id: '1',
    label: 'Work Hours',
    description: '',
    type: 'time-range',
    icon: '⏰',
    startTime: '09:00',
    endTime: '17:00'
  },
  {
    id: '2',
    label: 'Time Zone',
    description: '',
    type: 'select',
    value: 'America/New_York',
    icon: '🌍',
    options: timezoneOptions
  },
  {
    id: '3',
    label: 'Default Duration',
    description: '',
    type: 'select',
    value: '30',
    icon: '⏱️',
    options: durationOptions
  }
];

export const SidebarMenu = ({ onNewEvent }: SidebarMenuProps) => {
  const router = useRouter();
  const [isPastEventsExpanded, setIsPastEventsExpanded] = useState(false);
  const [isPreferencesExpanded, setIsPreferencesExpanded] = useState(false);
  const [preferences, setPreferences] = useState(mockPreferences);

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
    <div className="bg-white border border-secondary-200 rounded-lg p-4 h-[calc(100vh-8rem)] flex flex-col">
      <h3 className="text-lg font-display font-semibold text-neutral-900 mb-4">
        Menu
      </h3>
      
      {/* Fixed header section - always visible */}
      <div className="flex-shrink-0 mb-3">
        <Button 
          onClick={onNewEvent}
          className="w-full justify-start"
          size="sm"
        >
          ✨ New Event
        </Button>
      </div>
      
      {/* Scrollable content area - contains all expandable sections */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {/* Past Events Section */}
        <div className="flex-shrink-0">
          <button 
            onClick={handlePastEventsToggle}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-body text-neutral-700 hover:bg-neutral-50 rounded-md transition-colors"
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
              {mockPastEvents.map((event) => (
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
              ))}
            </div>
          )}
        </div>
        
        {/* Preferences Section */}
        <div className="flex-shrink-0">
          <button 
            onClick={handlePreferencesToggle}
            className="w-full flex items-center justify-between px-3 py-2 text-sm font-body text-neutral-700 hover:bg-neutral-50 rounded-md transition-colors"
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