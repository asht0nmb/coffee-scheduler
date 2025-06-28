'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface FinalizedMeeting {
  id: string;
  title: string;
  finalDateTime: Date;
  duration: number;
  participants: Array<{
    id: string;
    name: string;
    email?: string;
    timezone: string;
    confirmed: boolean;
  }>;
  meetingLink?: string;
  location?: string;
  description?: string;
}

// Mock finalized meeting data
const mockFinalizedMeeting: FinalizedMeeting = {
  id: '12345',
  title: 'Team Coffee Chat',
  finalDateTime: new Date(2025, 6, 15, 14, 0), // July 15, 2025 at 2 PM
  duration: 30,
  participants: [
    {
      id: '1',
      name: 'John Smith',
      email: 'john@company.com',
      timezone: 'America/Los_Angeles (PT)',
      confirmed: true
    },
    {
      id: '2', 
      name: 'Jane Doe',
      email: 'jane@company.com',
      timezone: 'America/New_York (ET)',
      confirmed: true
    },
    {
      id: '3',
      name: 'Mike Jones',
      email: 'mike@company.com', 
      timezone: 'Europe/London (GMT)',
      confirmed: false
    }
  ],
  meetingLink: 'https://zoom.us/j/1234567890',
  location: 'Conference Room A / Zoom',
  description: 'Monthly team coffee chat to discuss ongoing projects and team updates.'
};

export default function ResultsPage() {
  const [meeting] = useState<FinalizedMeeting>(mockFinalizedMeeting);
  const [isExporting, setIsExporting] = useState(false);

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    }) + ' at ' + date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getConfirmedCount = () => {
    return meeting.participants.filter(p => p.confirmed).length;
  };

  const handleExportCalendar = () => {
    setIsExporting(true);
    // Simulate calendar export
    setTimeout(() => {
      setIsExporting(false);
      alert('Calendar event exported successfully!');
    }, 1000);
  };

  const handleSendReminders = () => {
    alert('Reminder emails sent to all participants!');
  };

  const handleReschedule = () => {
    // Navigate back to scheduling
    window.history.back();
  };

  return (
    <div className="px-4 py-6 sm:px-0 max-w-4xl">
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
            Meeting Confirmed
          </h1>
        </div>
        <p className="font-body text-neutral-600">
          Your meeting has been successfully scheduled
        </p>
      </div>

      {/* Success Banner */}
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center">
          <div className="text-green-500 text-2xl mr-3">✓</div>
          <div>
            <h3 className="text-lg font-display font-semibold text-green-900">
              Meeting Successfully Scheduled!
            </h3>
            <p className="text-sm text-green-700">
              {getConfirmedCount()} of {meeting.participants.length} participants have confirmed attendance
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meeting Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Basic Info */}
          <div className="bg-white border border-secondary-200 rounded-lg p-6">
            <h2 className="text-xl font-display font-semibold text-neutral-900 mb-4">
              Meeting Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-neutral-700 mb-1">Event Title</h3>
                <p className="text-lg font-body text-neutral-900">{meeting.title}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-700 mb-1">Date & Time</h3>
                <p className="text-lg font-body text-neutral-900">{formatDateTime(meeting.finalDateTime)}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-neutral-700 mb-1">Duration</h3>
                <p className="text-lg font-body text-neutral-900">{meeting.duration} minutes</p>
              </div>

              {meeting.location && (
                <div>
                  <h3 className="text-sm font-medium text-neutral-700 mb-1">Location</h3>
                  <p className="text-lg font-body text-neutral-900">{meeting.location}</p>
                </div>
              )}

              {meeting.meetingLink && (
                <div>
                  <h3 className="text-sm font-medium text-neutral-700 mb-1">Meeting Link</h3>
                  <a 
                    href={meeting.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-body text-primary-600 hover:text-primary-700 underline"
                  >
                    {meeting.meetingLink}
                  </a>
                </div>
              )}

              {meeting.description && (
                <div>
                  <h3 className="text-sm font-medium text-neutral-700 mb-1">Description</h3>
                  <p className="text-base font-body text-neutral-900">{meeting.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Participants */}
          <div className="bg-white border border-secondary-200 rounded-lg p-6">
            <h2 className="text-xl font-display font-semibold text-neutral-900 mb-4">
              Participants ({meeting.participants.length})
            </h2>
            
            <div className="space-y-3">
              {meeting.participants.map((participant) => (
                <div 
                  key={participant.id}
                  className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-neutral-900">{participant.name}</h4>
                      {participant.confirmed ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Confirmed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          ⏳ Pending
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600 mt-1">
                      {participant.email} • {participant.timezone}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-secondary-200 rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-display font-semibold text-neutral-900">
              Actions
            </h2>
            
            <div className="space-y-3">
              <Button 
                onClick={handleExportCalendar}
                disabled={isExporting}
                className="w-full justify-start"
              >
                📅 {isExporting ? 'Exporting...' : 'Add to Calendar'}
              </Button>

              <Button 
                variant="outline"
                onClick={handleSendReminders}
                className="w-full justify-start"
              >
                📧 Send Reminders
              </Button>

              <Button 
                variant="outline"
                onClick={handleReschedule}
                className="w-full justify-start"
              >
                🔄 Reschedule Meeting
              </Button>

              <Button 
                variant="outline"
                onClick={() => window.print()}
                className="w-full justify-start"
              >
                🖨️ Print Details
              </Button>
            </div>

            {/* Meeting ID */}
            <div className="pt-4 border-t border-neutral-200">
              <h3 className="text-sm font-medium text-neutral-700 mb-2">Meeting ID</h3>
              <p className="text-sm font-mono text-neutral-600 bg-neutral-100 px-2 py-1 rounded">
                #{meeting.id}
              </p>
            </div>

            {/* Time Zone Info */}
            <div className="pt-4 border-t border-neutral-200">
              <h3 className="text-sm font-medium text-neutral-700 mb-2">Time Zones</h3>
              <div className="text-xs text-neutral-600 space-y-1">
                {Array.from(new Set(meeting.participants.map(p => p.timezone))).map((tz) => (
                  <div key={tz} className="flex justify-between">
                    <span>{tz.split(' ')[0]}:</span>
                    <span>{formatDateTime(meeting.finalDateTime)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}