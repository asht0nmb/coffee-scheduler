'use client';

import { CalendarPlaceholder } from '@/components/dashboard/calendar-placeholder';

// This would normally come from props.params, but for now we'll use mock data
export default function SchedulingPage() {
  // TODO: Load session data based on params.id
  // For now, using mock data
  const mockParticipants = [
    { id: '1', name: 'John Smith', timeSlots: ['Mon 9-10am', 'Wed 2-3pm'] },
    { id: '2', name: 'Jane Doe', timeSlots: ['Wed 2-3pm', 'Fri 4-5pm'] },
    { id: '3', name: 'Mike Jones', timeSlots: ['Mon 9-10am', 'Thu 11-12pm'] },
  ];

  const removeTimeSlot = (participantId: string, timeSlot: string) => {
    console.log(`Removing ${timeSlot} for participant ${participantId}`);
    // TODO: Implement time slot removal
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Participants Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-secondary-200 rounded-lg p-4">
            <h3 className="text-lg font-display font-semibold text-neutral-900 mb-4">
              Participants
            </h3>
            
            <div className="space-y-4">
              {mockParticipants.map((participant) => (
                <div key={participant.id} className="border-b border-secondary-100 pb-3 last:border-b-0">
                  <h4 className="font-medium text-neutral-900 mb-2">
                    • {participant.name}
                  </h4>
                  <div className="space-y-1">
                    {participant.timeSlots.map((timeSlot, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-primary-50 text-primary-700 px-2 py-1 rounded text-sm"
                      >
                        <span>{timeSlot}</span>
                        <button
                          onClick={() => removeTimeSlot(participant.id, timeSlot)}
                          className="text-primary-400 hover:text-red-500 transition-colors ml-2"
                        >
                          ❌
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Time Button */}
            <button className="w-full mt-4 px-3 py-2 text-sm font-body text-primary-600 hover:bg-primary-50 rounded-md transition-colors border border-primary-200">
              + Add Time Slot
            </button>
          </div>
        </div>
        
        {/* Calendar Integration */}
        <div className="lg:col-span-3">
          <CalendarPlaceholder />
        </div>
      </div>
    </div>
  );
}