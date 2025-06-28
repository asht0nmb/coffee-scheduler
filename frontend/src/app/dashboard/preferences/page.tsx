'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface UserPreferences {
  timezone: string;
  defaultDuration: number;
  workingHours: {
    start: string;
    end: string;
  };
  emailNotifications: boolean;
  reminderTime: number; // minutes before meeting
  weekendAvailability: boolean;
}

const timezoneOptions = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'GMT (London)' },
  { value: 'Europe/Paris', label: 'CET (Paris)' },
  { value: 'Asia/Tokyo', label: 'JST (Tokyo)' },
  { value: 'Asia/Shanghai', label: 'CST (Shanghai)' },
  { value: 'Australia/Sydney', label: 'AEST (Sydney)' }
];

export default function PreferencesPage() {
  const [preferences, setPreferences] = useState<UserPreferences>({
    timezone: 'America/New_York',
    defaultDuration: 30,
    workingHours: {
      start: '09:00',
      end: '17:00'
    },
    emailNotifications: true,
    reminderTime: 15,
    weekendAvailability: false
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setSaveMessage('Preferences saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    }, 1000);
  };

  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateWorkingHours = (field: 'start' | 'end', value: string) => {
    setPreferences(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [field]: value
      }
    }));
  };

  return (
    <div className="px-4 py-6 sm:px-0 max-w-2xl">
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
            Preferences
          </h1>
        </div>
        <p className="font-body text-neutral-600">
          Customize your scheduling preferences and default settings
        </p>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 font-medium">✓ {saveMessage}</p>
        </div>
      )}

      {/* Preferences Form */}
      <div className="bg-white border border-secondary-200 rounded-lg p-6 space-y-6">
        
        {/* Timezone Settings */}
        <div>
          <h3 className="text-lg font-display font-semibold text-neutral-900 mb-4">
            Time & Location
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Your Timezone
              </label>
              <select
                value={preferences.timezone}
                onChange={(e) => updatePreference('timezone', e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md font-body focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {timezoneOptions.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Working Hours
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Start Time</label>
                  <Input
                    type="time"
                    value={preferences.workingHours.start}
                    onChange={(e) => updateWorkingHours('start', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">End Time</label>
                  <Input
                    type="time"
                    value={preferences.workingHours.end}
                    onChange={(e) => updateWorkingHours('end', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Meeting Settings */}
        <div className="border-t border-neutral-200 pt-6">
          <h3 className="text-lg font-display font-semibold text-neutral-900 mb-4">
            Default Meeting Settings
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Default Meeting Duration
              </label>
              <select
                value={preferences.defaultDuration}
                onChange={(e) => updatePreference('defaultDuration', Number(e.target.value))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md font-body focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="weekend-availability"
                checked={preferences.weekendAvailability}
                onChange={(e) => updatePreference('weekendAvailability', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="weekend-availability" className="text-sm font-medium text-neutral-700">
                Include weekends in scheduling suggestions
              </label>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="border-t border-neutral-200 pt-6">
          <h3 className="text-lg font-display font-semibold text-neutral-900 mb-4">
            Notifications
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="email-notifications"
                checked={preferences.emailNotifications}
                onChange={(e) => updatePreference('emailNotifications', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="email-notifications" className="text-sm font-medium text-neutral-700">
                Send email notifications for scheduled meetings
              </label>
            </div>

            {preferences.emailNotifications && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Reminder Time
                </label>
                <select
                  value={preferences.reminderTime}
                  onChange={(e) => updatePreference('reminderTime', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md font-body focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value={5}>5 minutes before</option>
                  <option value={15}>15 minutes before</option>
                  <option value={30}>30 minutes before</option>
                  <option value={60}>1 hour before</option>
                  <option value={1440}>1 day before</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-neutral-200 pt-6">
          <div className="flex space-x-3">
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>

      {/* Current Settings Summary */}
      <div className="mt-6 bg-neutral-50 border border-neutral-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-neutral-700 mb-2">Current Settings Summary:</h4>
        <div className="text-xs text-neutral-600 space-y-1">
          <p>• Timezone: {timezoneOptions.find(tz => tz.value === preferences.timezone)?.label}</p>
          <p>• Working Hours: {preferences.workingHours.start} - {preferences.workingHours.end}</p>
          <p>• Default Duration: {preferences.defaultDuration} minutes</p>
          <p>• Weekend Availability: {preferences.weekendAvailability ? 'Enabled' : 'Disabled'}</p>
          <p>• Email Notifications: {preferences.emailNotifications ? 'Enabled' : 'Disabled'}</p>
        </div>
      </div>
    </div>
  );
}