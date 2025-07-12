'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface UserSettings {
  // Account Settings
  account: {
    name: string;
    email: string;
    loginNotifications: boolean;
  };
  
  // Preferences (moved from preferences page)
  preferences: {
    timezone: string;
    defaultDuration: number;
    workingHours: {
      start: string;
      end: string;
    };
    emailNotifications: boolean;
    reminderTime: number; // minutes before meeting
    weekendAvailability: boolean;
  };
  
  // Advanced Settings
  advanced: {
    syncFrequency: 'realtime' | 'hourly' | 'daily';
    dataRetention: number; // days
    analyticsEnabled: boolean;
    betaFeatures: boolean;
  };
}

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

export default function SettingsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<'account' | 'preferences' | 'advanced'>('account');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  const [settings, setSettings] = useState<UserSettings>({
    account: {
      name: 'John Doe',
      email: 'john.doe@gmail.com',
      loginNotifications: true
    },
    preferences: {
      timezone: 'America/New_York',
      defaultDuration: 30,
      workingHours: {
        start: '09:00',
        end: '17:00'
      },
      emailNotifications: true,
      reminderTime: 15,
      weekendAvailability: false
    },
    advanced: {
      syncFrequency: 'hourly',
      dataRetention: 365,
      analyticsEnabled: true,
      betaFeatures: false
    }
  });

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    }, 1000);
  };

  const updateSetting = <T extends keyof UserSettings>(
    section: T,
    key: keyof UserSettings[T],
    value: any
  ) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const updateWorkingHours = (field: 'start' | 'end', value: string) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        workingHours: {
          ...prev.preferences.workingHours,
          [field]: value
        }
      }
    }));
  };

  const sectionTabs = [
    { key: 'account', label: 'Account', icon: '👤' },
    { key: 'preferences', label: 'Preferences', icon: '⚙️' },
    { key: 'advanced', label: 'Advanced', icon: '🔧' }
  ] as const;

  return (
    <div className="px-4 py-6 sm:px-0 max-w-4xl">
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
            Settings
          </h1>
        </div>
        <p className="font-body text-neutral-600">
          Manage your account, preferences, and advanced settings
        </p>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 font-medium">✓ {saveMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Side Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <nav className="space-y-2">
              {sectionTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveSection(tab.key)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    activeSection === tab.key
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  <span className="mr-3 text-base">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            
            {/* Account Settings */}
            {activeSection === 'account' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-display font-semibold text-neutral-900 mb-4">
                    Account Settings
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Profile Information */}
                    <div>
                      <h4 className="text-md font-medium text-neutral-700 mb-3">Profile Information</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Name
                          </label>
                          <Input
                            value={settings.account.name}
                            disabled
                            className="bg-neutral-50 text-neutral-500"
                          />
                          <p className="text-xs text-neutral-500 mt-1">Name is synced from your Google account</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Email Address
                          </label>
                          <Input
                            type="email"
                            value={settings.account.email}
                            disabled
                            className="bg-neutral-50 text-neutral-500"
                          />
                          <p className="text-xs text-neutral-500 mt-1">Email is synced from your Google account</p>
                        </div>
                      </div>
                    </div>

                    {/* Notifications */}
                    <div className="border-t border-neutral-200 pt-6">
                      <h4 className="text-md font-medium text-neutral-700 mb-3">Notifications</h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-neutral-700">Login Notifications</label>
                          <p className="text-xs text-neutral-500">Get notified when someone logs into your account</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.account.loginNotifications}
                          onChange={(e) => updateSetting('account', 'loginNotifications', e.target.checked)}
                          className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Settings */}
            {activeSection === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-display font-semibold text-neutral-900 mb-4">
                    Scheduling Preferences
                  </h3>
                  
                  {/* Time & Location */}
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-neutral-700 mb-3">Time & Location</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Your Timezone
                        </label>
                        <select
                          value={settings.preferences.timezone}
                          onChange={(e) => updateSetting('preferences', 'timezone', e.target.value)}
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
                              value={settings.preferences.workingHours.start}
                              onChange={(e) => updateWorkingHours('start', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-neutral-500 mb-1">End Time</label>
                            <Input
                              type="time"
                              value={settings.preferences.workingHours.end}
                              onChange={(e) => updateWorkingHours('end', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Meeting Settings */}
                  <div className="border-t border-neutral-200 pt-6 mb-6">
                    <h4 className="text-md font-medium text-neutral-700 mb-3">Default Meeting Settings</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Default Meeting Duration
                        </label>
                        <select
                          value={settings.preferences.defaultDuration}
                          onChange={(e) => updateSetting('preferences', 'defaultDuration', Number(e.target.value))}
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
                          checked={settings.preferences.weekendAvailability}
                          onChange={(e) => updateSetting('preferences', 'weekendAvailability', e.target.checked)}
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
                    <h4 className="text-md font-medium text-neutral-700 mb-3">Notifications</h4>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="email-notifications"
                          checked={settings.preferences.emailNotifications}
                          onChange={(e) => updateSetting('preferences', 'emailNotifications', e.target.checked)}
                          className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="email-notifications" className="text-sm font-medium text-neutral-700">
                          Send email notifications for scheduled meetings
                        </label>
                      </div>

                      {settings.preferences.emailNotifications && (
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Reminder Time
                          </label>
                          <select
                            value={settings.preferences.reminderTime}
                            onChange={(e) => updateSetting('preferences', 'reminderTime', Number(e.target.value))}
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
                </div>
              </div>
            )}

            {/* Advanced Settings */}
            {activeSection === 'advanced' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-display font-semibold text-neutral-900 mb-4">
                    Advanced Settings
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Sync Settings */}
                    <div>
                      <h4 className="text-md font-medium text-neutral-700 mb-3">Calendar Sync</h4>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Google Calendar Sync Frequency
                        </label>
                        <select
                          value={settings.advanced.syncFrequency}
                          onChange={(e) => updateSetting('advanced', 'syncFrequency', e.target.value)}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-md font-body focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="realtime">Real-time</option>
                          <option value="hourly">Every hour</option>
                          <option value="daily">Once daily</option>
                        </select>
                        <p className="text-xs text-neutral-500 mt-1">How often to sync with your Google Calendar</p>
                      </div>
                    </div>

                    {/* Data Management */}
                    <div className="border-t border-neutral-200 pt-6">
                      <h4 className="text-md font-medium text-neutral-700 mb-3">Data Management</h4>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Data Retention Period
                        </label>
                        <select
                          value={settings.advanced.dataRetention}
                          onChange={(e) => updateSetting('advanced', 'dataRetention', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-md font-body focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value={90}>3 months</option>
                          <option value={180}>6 months</option>
                          <option value={365}>1 year</option>
                          <option value={730}>2 years</option>
                          <option value={-1}>Forever</option>
                        </select>
                        <p className="text-xs text-neutral-500 mt-1">How long to keep old event data</p>
                      </div>
                    </div>

                    {/* Privacy & Features */}
                    <div className="border-t border-neutral-200 pt-6">
                      <h4 className="text-md font-medium text-neutral-700 mb-3">Privacy & Features</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-neutral-700">Analytics & Usage Tracking</label>
                            <p className="text-xs text-neutral-500">Help improve the app by sharing anonymous usage data</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.advanced.analyticsEnabled}
                            onChange={(e) => updateSetting('advanced', 'analyticsEnabled', e.target.checked)}
                            className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-neutral-700">Beta Features</label>
                            <p className="text-xs text-neutral-500">Get early access to new features (may be unstable)</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.advanced.betaFeatures}
                            onChange={(e) => updateSetting('advanced', 'betaFeatures', e.target.checked)}
                            className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="border-t border-neutral-200 pt-6">
                      <h4 className="text-md font-medium text-neutral-700 mb-3 text-red-600">Account Actions</h4>
                      <div className="space-y-3">
                        <Button variant="outline" size="sm" className="text-blue-600 border-blue-300 hover:bg-blue-50">
                          📥 Export All Data
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">
                          🗑️ Delete Account
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Actions */}
            <div className="border-t border-neutral-200 pt-6 mt-8">
              <div className="flex space-x-3">
                <Button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/dashboard')}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Settings Summary */}
      <div className="mt-6 bg-neutral-50 border border-neutral-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-neutral-700 mb-2">Current Settings Summary:</h4>
        <div className="text-xs text-neutral-600 space-y-1">
          <p>• Account: {settings.account.name} ({settings.account.email})</p>
          <p>• Timezone: {timezoneOptions.find(tz => tz.value === settings.preferences.timezone)?.label}</p>
          <p>• Working Hours: {settings.preferences.workingHours.start} - {settings.preferences.workingHours.end}</p>
          <p>• Default Duration: {settings.preferences.defaultDuration} minutes</p>
          <p>• Sync Frequency: {settings.advanced.syncFrequency}</p>
          <p>• Data Retention: {settings.advanced.dataRetention === -1 ? 'Forever' : `${settings.advanced.dataRetention} days`}</p>
        </div>
      </div>
    </div>
  );
}