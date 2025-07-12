'use client';

import { useState } from 'react';

interface TimeSlot {
  id: string;
  participantId: string;
  participantName: string;
  day: string;
  dayNum: number;
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
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek); // Start on Sunday
    return startOfWeek;
  });

  // Convert participant time slots to calendar events
  const parseTimeSlots = () => {
    const slots: TimeSlot[] = [];
    participants.forEach((participant) => {
      participant.timeSlots.forEach((timeSlot, index) => {
        const [day, time] = timeSlot.split(' ');
        // Map day abbreviations to day numbers (0 = Sunday)
        const dayMap: { [key: string]: number } = {
          'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
        };
        const dayNum = dayMap[day] ?? 1; // Default to Monday if not found
        
        slots.push({
          id: `${participant.id}-${index}`,
          participantId: participant.id,
          participantName: participant.name,
          day,
          dayNum,
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
      'bg-blue-200 border-blue-400', // Participant 1
      'bg-blue-300 border-blue-500', // Participant 2  
      'bg-blue-400 border-blue-600', // Participant 3
    ];
    const participantIndex = parseInt(slot.participantId) - 1;
    return colors[participantIndex % colors.length];
  };

  const getSelectedSlotColor = (slot: TimeSlot) => {
    const colors = [
      'bg-blue-500 border-blue-700', // Participant 1 selected
      'bg-blue-600 border-blue-800', // Participant 2 selected
      'bg-blue-700 border-blue-900', // Participant 3 selected
    ];
    const participantIndex = parseInt(slot.participantId) - 1;
    return colors[participantIndex % colors.length];
  };

  const getParticipantInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatWeekRange = (startDate: Date) => {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    const startMonth = startDate.toLocaleDateString('en-US', { month: 'long' });
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'long' });
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const year = startDate.getFullYear();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}, ${year}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekStart(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
  };

  // Group slots by day number for calendar display
  const groupedSlots = timeSlots.reduce((acc, slot) => {
    if (!acc[slot.dayNum]) acc[slot.dayNum] = [];
    acc[slot.dayNum].push(slot);
    return acc;
  }, {} as Record<number, TimeSlot[]>);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Generate calendar days for current week
  const getCalendarDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      days.push(date);
    }
    return days;
  };
  
  const calendarDays = getCalendarDays();

  return (
    <div className="bg-white border border-secondary-200 rounded-lg min-h-[calc(100vh-8rem)] relative overflow-hidden">
      <div className="p-4 h-full">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display font-semibold text-neutral-900">
            Week of {formatWeekRange(currentWeekStart)}
          </h3>
          <div className="flex space-x-2">
            <button 
              onClick={() => navigateWeek('prev')}
              className="p-1 hover:bg-neutral-100 rounded cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={() => navigateWeek('next')}
              className="p-1 hover:bg-neutral-100 rounded cursor-pointer"
            >
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
                  index === 0 ? 'bg-blue-200 border-blue-400' :
                  index === 1 ? 'bg-blue-300 border-blue-500' :
                  'bg-blue-400 border-blue-600'
                }`}></div>
                <span className="text-neutral-600">{participant.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-neutral-200 rounded-lg overflow-hidden">
          {/* Day Headers */}
          {daysOfWeek.map((day) => (
            <div key={day} className="bg-neutral-50 p-2 text-center text-xs font-medium text-neutral-600">
              {day}
            </div>
          ))}
          
          {/* Calendar Days */}
          {calendarDays.map((date, index) => {
            const daySlots = groupedSlots[date.getDay()] || [];
            
            return (
              <div key={index} className="bg-white p-2 min-h-16">
                <div className="text-xs font-medium mb-1 text-neutral-900">
                  {date.getDate()}
                </div>
                
                {/* Time Slots for this day */}
                <div className="space-y-1">
                  {daySlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => handleSlotClick(slot)}
                      className={`w-full p-1 rounded text-xs font-medium transition-all duration-200 border relative cursor-pointer ${
                        isSlotSelected(slot)
                          ? `${getSelectedSlotColor(slot)} text-white shadow-md`
                          : `${getSlotColor(slot)} text-blue-800 hover:shadow-sm`
                      }`}
                      title={`${slot.participantName}: ${slot.displayText}`}
                    >
                      <div className="truncate">{slot.time}</div>
                      <div className="text-xs opacity-75 truncate flex items-center justify-between">
                        <span>{getParticipantInitials(slot.participantName)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
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
    </div>
  );
};