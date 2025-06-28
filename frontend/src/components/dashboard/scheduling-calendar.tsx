'use client';

import { useState } from 'react';

interface TimeSlot {
  id: string;
  participantId: string;
  participantName: string;
  day: string;
  time: string;
  displayText: string;
  isSelected: boolean;
}

interface SchedulingCalendarProps {
  participants: Array<{
    id: string;
    name: string;
    timezone: string;
    timeSlots: string[];
  }>;
  onSlotSelect?: (participantId: string, timeSlot: string) => void;
}

export const SchedulingCalendar = ({ participants, onSlotSelect }: SchedulingCalendarProps) => {
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());

  // Convert participant time slots to calendar events
  const parseTimeSlots = () => {
    const slots: TimeSlot[] = [];
    participants.forEach((participant) => {
      participant.timeSlots.forEach((timeSlot, index) => {
        const [day, time] = timeSlot.split(' ');
        slots.push({
          id: `${participant.id}-${index}`,
          participantId: participant.id,
          participantName: participant.name,
          day,
          time,
          displayText: timeSlot,
          isSelected: false
        });
      });
    });
    return slots;
  };

  const timeSlots = parseTimeSlots();

  const handleSlotClick = (slot: TimeSlot) => {
    const slotKey = `${slot.participantId}-${slot.displayText}`;
    const newSelectedSlots = new Set(selectedSlots);
    
    if (selectedSlots.has(slotKey)) {
      newSelectedSlots.delete(slotKey);
    } else {
      newSelectedSlots.add(slotKey);
    }
    
    setSelectedSlots(newSelectedSlots);
    onSlotSelect?.(slot.participantId, slot.displayText);
  };

  const isSlotSelected = (slot: TimeSlot) => {
    return selectedSlots.has(`${slot.participantId}-${slot.displayText}`);
  };

  const getSlotColor = (slot: TimeSlot) => {
    const colors = [
      'bg-purple-200 border-purple-400', // Participant 1
      'bg-purple-300 border-purple-500', // Participant 2  
      'bg-purple-400 border-purple-600', // Participant 3
    ];
    const participantIndex = parseInt(slot.participantId) - 1;
    return colors[participantIndex % colors.length];
  };

  const getSelectedSlotColor = (slot: TimeSlot) => {
    const colors = [
      'bg-purple-500 border-purple-700', // Participant 1 selected
      'bg-purple-600 border-purple-800', // Participant 2 selected
      'bg-purple-700 border-purple-900', // Participant 3 selected
    ];
    const participantIndex = parseInt(slot.participantId) - 1;
    return colors[participantIndex % colors.length];
  };

  // Group slots by day for display
  const groupedSlots = timeSlots.reduce((acc, slot) => {
    if (!acc[slot.day]) acc[slot.day] = [];
    acc[slot.day].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  return (
    <div className="bg-white border border-secondary-200 rounded-lg p-4 h-fit">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-display font-semibold text-neutral-900">
          Suggested Meeting Times
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

      {/* Legend */}
      <div className="mb-4 p-3 bg-neutral-50 rounded-lg">
        <h4 className="text-sm font-medium text-neutral-700 mb-2">Legend:</h4>
        <div className="flex flex-wrap gap-2 text-xs">
          {participants.map((participant, index) => (
            <div key={participant.id} className="flex items-center space-x-1">
              <div className={`w-3 h-3 rounded border ${
                index === 0 ? 'bg-purple-200 border-purple-400' :
                index === 1 ? 'bg-purple-300 border-purple-500' :
                'bg-purple-400 border-purple-600'
              }`}></div>
              <span className="text-neutral-600">{participant.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-5 gap-2">
        {daysOfWeek.map((day) => (
          <div key={day} className="space-y-2">
            {/* Day Header */}
            <div className="text-center text-sm font-medium text-neutral-700 py-2 bg-neutral-50 rounded">
              {day}
            </div>
            
            {/* Time Slots for this day */}
            <div className="space-y-1 min-h-32">
              {groupedSlots[day]?.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => handleSlotClick(slot)}
                  className={`w-full p-2 rounded text-xs font-medium transition-all duration-200 border-2 ${
                    isSlotSelected(slot)
                      ? `${getSelectedSlotColor(slot)} text-white shadow-md`
                      : `${getSlotColor(slot)} text-purple-800 hover:shadow-sm`
                  }`}
                  title={`${slot.participantName}: ${slot.displayText}`}
                >
                  <div className="truncate">{slot.time}</div>
                  <div className="text-xs opacity-75 truncate">{slot.participantName}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Selected slots summary */}
      {selectedSlots.size > 0 && (
        <div className="mt-4 p-3 bg-primary-50 rounded-lg">
          <h4 className="text-sm font-medium text-primary-900 mb-2">
            Selected Time Slots ({selectedSlots.size}):
          </h4>
          <div className="flex flex-wrap gap-1">
            {Array.from(selectedSlots).map((slotKey) => {
              const [participantId, timeSlot] = slotKey.split('-');
              const participant = participants.find(p => p.id === participantId);
              return (
                <span key={slotKey} className="inline-block px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded">
                  {participant?.name}: {timeSlot}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};