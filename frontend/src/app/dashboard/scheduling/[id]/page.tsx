'use client';

import { SchedulingCalendar } from '@/components/dashboard/scheduling-calendar';
import { Button } from '@/components/ui/button';

// Mock data with exactly 3 time slots per person (algorithm-generated)

export default function SchedulingPage() {
  // Enhanced mock data with timezone and algorithm-generated slots
  const mockParticipants = [
    { 
      id: '1', 
      name: 'John Smith', 
      timezone: 'America/Los_Angeles (PT)',
      timeSlots: ['Mon 9-10am', 'Wed 2-3pm', 'Fri 11-12pm']
    },
    { 
      id: '2', 
      name: 'Jane Doe', 
      timezone: 'America/New_York (ET)',
      timeSlots: ['Mon 9-10am', 'Tue 1-2pm', 'Thu 3-4pm']
    },
    { 
      id: '3', 
      name: 'Mike Jones', 
      timezone: 'Europe/London (GMT)',
      timeSlots: ['Wed 2-3pm', 'Thu 10-11am', 'Fri 4-5pm']
    },
  ];

  const removeTimeSlot = (participantId: string, timeSlot: string) => {
    console.log(`Removing ${timeSlot} for participant ${participantId}`);
    // TODO: Implement time slot removal
  };

  const handleSlotSelect = (participantId: string, timeSlot: string) => {
    console.log(`Selected ${timeSlot} for participant ${participantId}`);
    // TODO: Sync with sidebar chips
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-neutral-900 mb-2">
          Schedule Your Coffee Chats
        </h1>
        <p className="text-neutral-600 font-body">
          Review suggested times and select your preferred slots for each participant.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Participants Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-display font-semibold text-neutral-900 mb-4">
              Participants
            </h3>
            
            <div className="space-y-6">
              {mockParticipants.map((participant) => (
                <div key={participant.id} className="group">
                  <div className="mb-4">
                    <h4 className="font-display font-semibold text-neutral-900 flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 bg-primary-500 rounded-full flex-shrink-0"></div>
                      <span className="truncate">{participant.name}</span>
                    </h4>
                    <p className="text-sm text-neutral-500 ml-6 font-body">
                      {participant.timezone}
                    </p>
                  </div>
                  
                  <div className="ml-6 space-y-2">
                    {participant.timeSlots.map((timeSlot, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-neutral-100 text-neutral-700 px-3 py-1.5 rounded text-sm"
                      >
                        <span className="font-medium">{timeSlot}</span>
                        <Button
                          onClick={() => removeTimeSlot(participant.id, timeSlot)}
                          variant="ghost"
                          size="sm"
                          className="w-6 h-6 p-0 text-primary-500 hover:text-red-500 hover:bg-red-50"
                          aria-label={`Remove ${timeSlot}`}
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Divider between participants */}
                  <div className="mt-6 border-b border-neutral-100 last:border-b-0"></div>
                </div>
              ))}
            </div>

            {/* Add Time Button */}
            <Button
              variant="outline"
              className="w-full mt-4 text-primary-600 border-primary-200 hover:bg-primary-50"
            >
              + Add Time Slot
            </Button>
          </div>
        </div>
        
        {/* Calendar Integration */}
        <div className="lg:col-span-3">
          <SchedulingCalendar 
            participants={mockParticipants}
            onSlotSelect={handleSlotSelect}
          />
        </div>
      </div>
    </div>
  );
}