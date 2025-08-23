'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useScheduling } from '@/contexts/scheduling-context';
import { Button } from '@/components/ui/button';

interface SchedulingSessionData {
  sessionId: string;
  participants?: Array<{
    id: string;
    name: string;
    timezone: string;
    email?: string;
  }>;
  duration: number;
  selectedSlots?: Array<{
    contactId: string;
    selectedSlot: string;
  }>;
}

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

// Transform scheduling session data to finalized meeting format
const transformSessionToMeeting = (session: SchedulingSessionData, selectedSlots: Array<{ contactId: string; selectedSlot: string; }>): FinalizedMeeting => {
  return {
    id: session.sessionId,
    title: 'Coffee Chat Meeting',
    finalDateTime: new Date(), // This would be calculated from selected slot
    duration: session.duration || 30,
    participants: session.participants?.map((participant) => {
      const selection = selectedSlots.find(s => s.contactId === participant.id);
      return {
        id: participant.id,
        name: participant.name,
        email: participant.email || '',
        timezone: participant.timezone,
        confirmed: !!selection // Confirmed if they have a selected slot
      };
    }) || [],
    meetingLink: '', // To be generated
    location: 'TBD',
    description: 'Scheduled coffee chat meeting.'
  };
};

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  
  const { currentSession, loadSession, getSelectedSlots, isLoading, error } = useScheduling();
  
  const [meeting, setMeeting] = useState<FinalizedMeeting | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Load session data and transform to meeting format
  useEffect(() => {
    const loadMeetingData = async () => {
      setIsLoadingSession(true);
      
      try {
        let sessionData = currentSession;
        
        // Load session if not already available
        if (!sessionData || sessionData.sessionId !== sessionId) {
          sessionData = await loadSession(sessionId);
        }
        
        if (sessionData) {
          // Get the confirmed selections
          const selectedSlots = sessionData.selectedSlots || getSelectedSlots();
          
          // Transform session data to meeting format
          const meetingData = transformSessionToMeeting(sessionData, selectedSlots);
          setMeeting(meetingData);
        } else {
          console.error('Session not found for results page');
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Failed to load meeting data:', err);
        router.push('/dashboard');
      } finally {
        setIsLoadingSession(false);
      }
    };

    if (sessionId) {
      loadMeetingData();
    }
  }, [sessionId, currentSession, loadSession, getSelectedSlots, router]);

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
    return meeting?.participants.filter(p => p.confirmed).length || 0;
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
    router.push(`/dashboard/scheduling/${sessionId}`);
  };

  // Show loading state
  if (isLoadingSession || isLoading) {
    return (
      <div className="px-4 py-6 sm:px-0 max-w-4xl">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading meeting results...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !meeting) {
    return (
      <div className="px-4 py-6 sm:px-0 max-w-4xl">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Meeting Not Found</h2>
            <p className="text-neutral-600 mb-4">
              {error || 'The meeting results could not be loaded.'}
            </p>
            <Button onClick={() => router.push('/dashboard')}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <button 
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.history.back();
              }
            }}
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
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.print();
                  }
                }}
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