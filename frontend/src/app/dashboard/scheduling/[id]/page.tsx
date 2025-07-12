'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SchedulingCalendar } from '@/components/dashboard/scheduling-calendar';
import { Button } from '@/components/ui/button';
import { ExitConfirmationModal } from '@/components/scheduling/exit-confirmation-modal';

// Mock data with exactly 3 time slots per person (algorithm-generated)
const initialParticipants = [
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

export default function SchedulingPage() {
  const router = useRouter();
  const [participants, setParticipants] = useState(initialParticipants);
  const [draggedSlot, setDraggedSlot] = useState<{timeSlot: string, participantId: string} | null>(null);
  const [dropZoneParticipantId, setDropZoneParticipantId] = useState<string | null>(null);
  const [activeInteractionZone, setActiveInteractionZone] = useState<string | null>(null);
  const [pendingDeleteSlot, setPendingDeleteSlot] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  const removeTimeSlot = (participantId: string, timeSlot: string) => {
    setParticipants(prev => prev.map(participant => 
      participant.id === participantId 
        ? { ...participant, timeSlots: participant.timeSlots.filter(slot => slot !== timeSlot) }
        : participant
    ));
    // Reset interaction states
    setPendingDeleteSlot(null);
    setActiveInteractionZone(null);
  };

  const moveTimeSlot = (timeSlot: string, fromParticipantId: string, toParticipantId: string) => {
    if (fromParticipantId === toParticipantId) return; // No-op if same participant
    
    setParticipants(prev => prev.map(participant => {
      if (participant.id === fromParticipantId) {
        // Remove from source
        return { ...participant, timeSlots: participant.timeSlots.filter(slot => slot !== timeSlot) };
      } else if (participant.id === toParticipantId) {
        // Add to destination (avoid duplicates)
        const hasSlot = participant.timeSlots.includes(timeSlot);
        return hasSlot ? participant : { ...participant, timeSlots: [...participant.timeSlots, timeSlot] };
      }
      return participant;
    }));
  };

  const handleDragStart = (e: React.DragEvent, timeSlot: string, participantId: string) => {
    console.log('Drag start:', timeSlot, 'from participant:', participantId);
    const dragData = { timeSlot, participantId };
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    setDraggedSlot(dragData);
  };

  const handleDragEnd = () => {
    setDraggedSlot(null);
    setDropZoneParticipantId(null);
  };

  const handleDragOver = (e: React.DragEvent, participantId: string) => {
    e.preventDefault(); // Allow drop
    setDropZoneParticipantId(participantId);
  };

  const handleDragLeave = () => {
    setDropZoneParticipantId(null);
  };

  const handleDrop = (e: React.DragEvent, targetParticipantId: string) => {
    e.preventDefault();
    const dragDataString = e.dataTransfer.getData('text/plain');
    if (dragDataString) {
      const dragData = JSON.parse(dragDataString);
      moveTimeSlot(dragData.timeSlot, dragData.participantId, targetParticipantId);
    }
    setDropZoneParticipantId(null);
    setDraggedSlot(null);
  };

  const handleHamburgerHover = (participantId: string, timeSlot: string) => {
    const slotId = `${participantId}-${timeSlot}`;
    console.log('Hamburger hovered - activating interaction zone:', slotId);
    setActiveInteractionZone(slotId);
  };

  const handleInteractionZoneLeave = () => {
    console.log('Interaction zone left - deactivating');
    setActiveInteractionZone(null);
  };

  const handleDeleteClick = (participantId: string, timeSlot: string) => {
    const slotId = `${participantId}-${timeSlot}`;
    setPendingDeleteSlot(slotId);
  };

  const handleConfirmDelete = (participantId: string, timeSlot: string) => {
    removeTimeSlot(participantId, timeSlot);
    setPendingDeleteSlot(null);
    setActiveInteractionZone(null);
  };

  const handleCancelDelete = () => {
    setPendingDeleteSlot(null);
  };

  const handleSlotSelect = (participantId: string, timeSlot: string) => {
    console.log(`Selected ${timeSlot} for participant ${participantId}`);
    // TODO: Sync with sidebar chips
  };

  const handleExitClick = () => {
    setShowExitModal(true);
  };

  const handleExitCancel = () => {
    setShowExitModal(false);
  };

  const handleExitConfirm = () => {
    setShowExitModal(false);
    router.push('/dashboard');
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-neutral-900 mb-2">
              Schedule Your Coffee Chats
            </h1>
            <p className="text-neutral-600 font-body">
              Review suggested times and select your preferred slots for each participant.
            </p>
          </div>
          
          {/* Exit Button */}
          <button
            onClick={handleExitClick}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-800 transition-colors cursor-pointer"
            aria-label="Exit scheduling"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Participants Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-display font-semibold text-neutral-900 mb-4">
              Participants
            </h3>
            
            <div className="space-y-6">
              {participants.map((participant) => {
                const isDropZone = dropZoneParticipantId === participant.id;
                const isDragSource = draggedSlot?.participantId === participant.id;
                
                return (
                <div 
                  key={participant.id} 
                  className={`group transition-colors duration-300 border rounded-lg ${
                    isDropZone ? 'border-primary-400' : isDragSource ? 'border-primary-400' : 'border-transparent'
                  } ${
                    isDragSource ? 'opacity-75' : ''
                  }`}
                  onDragOver={(e) => handleDragOver(e, participant.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, participant.id)}
                >
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
                    {participant.timeSlots.map((timeSlot, index) => {
                      const slotId = `${participant.id}-${timeSlot}`;
                      const isBeingDragged = draggedSlot?.timeSlot === timeSlot && draggedSlot?.participantId === participant.id;
                      const isInteractionActive = activeInteractionZone === slotId;
                      const isPendingDelete = pendingDeleteSlot === slotId;
                      
                      // Debug logging
                      if (isInteractionActive) {
                        console.log('Interaction zone active for:', slotId);
                      }
                      
                      return (
                      <div
                        key={index}
                        className={`flex items-center justify-between bg-neutral-100 text-neutral-700 px-3 py-1.5 rounded text-sm transition-all duration-200 ${
                          isBeingDragged ? 'opacity-50 scale-95' : 'hover:bg-neutral-200'
                        }`}
                      >
                        <span className="font-medium">{timeSlot}</span>
                        
                        {/* Interaction Zone - Only activates via hamburger hover */}
                        <div 
                          className="flex items-center gap-1 min-w-[80px] justify-end"
                          onMouseLeave={() => {
                            console.log('Interaction zone left completely');
                            handleInteractionZoneLeave();
                          }}
                        >
                          
                          {/* Confirmation Panel - appears on X click */}
                          {isPendingDelete && (
                            <div className="flex items-center gap-1 transition-all duration-200">
                              <Button
                                onClick={() => handleConfirmDelete(participant.id, timeSlot)}
                                variant="ghost"
                                size="sm"
                                className="w-5 h-5 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                aria-label={`Confirm delete ${timeSlot}`}
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </Button>
                              <Button
                                onClick={handleCancelDelete}
                                variant="ghost"
                                size="sm"
                                className="w-5 h-5 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                aria-label={`Cancel delete ${timeSlot}`}
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </Button>
                            </div>
                          )}
                          
                          {/* X Button - appears only after hamburger hover */}
                          {isInteractionActive && !isPendingDelete && (
                            <Button
                              onClick={() => {
                                console.log('X button clicked for:', participant.id, timeSlot);
                                handleDeleteClick(participant.id, timeSlot);
                              }}
                              variant="ghost"
                              size="sm"
                              className="w-5 h-5 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                              aria-label={`Delete ${timeSlot}`}
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </Button>
                          )}
                          
                          {/* Three-line Drag Handle - Activates interaction zone on hover */}
                          <div
                            draggable
                            onDragStart={(e) => {
                              console.log('Drag started for:', participant.id, timeSlot);
                              handleDragStart(e, timeSlot, participant.id);
                            }}
                            onDragEnd={handleDragEnd}
                            onMouseEnter={() => handleHamburgerHover(participant.id, timeSlot)}
                            className="w-6 h-6 flex items-center justify-center cursor-move text-neutral-400 hover:text-neutral-600 transition-colors duration-200"
                            aria-label={`Drag to move ${timeSlot}`}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 5h14a1 1 0 110 2H3a1 1 0 110-2zM3 9h14a1 1 0 110 2H3a1 1 0 110-2zM3 13h14a1 1 0 110 2H3a1 1 0 110-2z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                  
                  {/* Divider between participants */}
                  <div className="mt-6 border-b border-neutral-100 last:border-b-0"></div>
                </div>
                );
              })}
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
            participants={participants}
            onSlotSelect={handleSlotSelect}
          />
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      <ExitConfirmationModal
        isOpen={showExitModal}
        onCancel={handleExitCancel}
        onConfirm={handleExitConfirm}
      />
    </div>
  );
}