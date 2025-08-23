'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useScheduling, useSchedulingValidation } from '@/contexts/scheduling-context';
import { SchedulingCalendar } from '@/components/dashboard/scheduling-calendar';
import { Button } from '@/components/ui/button';
import { ExitConfirmationModal } from '@/components/scheduling/exit-confirmation-modal';
import { AddParticipantModal } from '@/components/scheduling/add-participant-modal';

interface Participant {
  id: string;
  name: string;
  timezone: string;
  email?: string;
  timeSlots: string[];
}

export default function SchedulingPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  
  const { 
    currentSession, 
    loadSession, 
    isLoading, 
    error, 
    selectSlot, 
    getSelectedSlots,
    confirmScheduling
  } = useScheduling();
  
  const { isReadyForConfirmation } = useSchedulingValidation();
  
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [draggedSlot, setDraggedSlot] = useState<{timeSlot: string, participantId: string} | null>(null);
  const [dropZoneParticipantId, setDropZoneParticipantId] = useState<string | null>(null);
  const [activeInteractionZone, setActiveInteractionZone] = useState<string | null>(null);
  const [pendingDeleteSlot, setPendingDeleteSlot] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [showAddParticipantModal, setShowAddParticipantModal] = useState<boolean>(false);
  const [editingParticipant, setEditingParticipant] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');

  // Load scheduling session data when component mounts
  useEffect(() => {
    const loadSchedulingData = async () => {
      setIsLoadingSession(true);
      
      try {
        // If we already have the current session loaded, use it
        if (currentSession && currentSession.sessionId === sessionId) {
          setParticipants(currentSession.participants || []);
        } else {
          // Load session data from storage or backend
          const sessionData = await loadSession(sessionId);
          if (sessionData && sessionData.participants) {
            setParticipants(sessionData.participants);
          } else {
            // Session not found, redirect to dashboard
            console.error('Scheduling session not found');
            router.push('/dashboard');
          }
        }
      } catch (err) {
        console.error('Failed to load scheduling session:', err);
        router.push('/dashboard');
      } finally {
        setIsLoadingSession(false);
      }
    };

    if (sessionId) {
      loadSchedulingData();
    }
  }, [sessionId, currentSession, loadSession, router]);

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
    setActiveInteractionZone(slotId);
  };

  const handleInteractionZoneLeave = () => {
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
    // Use scheduling context to track slot selections
    selectSlot(participantId, timeSlot);
    console.debug('Slot selected:', { participantId, timeSlot });
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

  const handleAddParticipant = (participantData: { name: string; email: string; timezone: string }) => {
    const newParticipant: Participant = {
      id: Date.now().toString(),
      name: participantData.name,
      timezone: participantData.timezone,
      email: participantData.email,
      timeSlots: []
    };
    setParticipants(prev => [...prev, newParticipant]);
  };

  const handleNameEdit = (participantId: string, currentName: string) => {
    setEditingParticipant(participantId);
    setEditedName(currentName);
  };

  const handleNameSave = (participantId: string) => {
    setParticipants(prev => prev.map(participant => 
      participant.id === participantId 
        ? { ...participant, name: editedName.trim() }
        : participant
    ));
    setEditingParticipant(null);
    setEditedName('');
  };

  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      setShowExitModal(true);
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, []);

  const handleConfirmSelections = async () => {
    if (!isReadyForConfirmation) {
      alert('Please select a time slot for each participant before confirming.');
      return;
    }

    setIsConfirming(true);
    
    try {
      // Confirm the scheduling and create pending events
      await confirmScheduling(sessionId);
      
      // Navigate to results page
      router.push(`/dashboard/results/${sessionId}`);
    } catch (err) {
      console.error('Failed to confirm scheduling:', err);
      alert('Failed to confirm your selections. Please try again.');
    } finally {
      setIsConfirming(false);
    }
  };

  // Show loading state while session is being loaded
  if (isLoadingSession || isLoading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading your scheduling session...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if session failed to load
  if (error || participants.length === 0) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Session Not Found</h2>
            <p className="text-neutral-600 mb-4">
              {error || 'The scheduling session could not be loaded.'}
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
          <Button
            onClick={handleExitClick}
            className="bg-primary-600 hover:bg-primary-700 text-white"
          >
            ✕ Exit
          </Button>
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
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-3 h-3 bg-primary-500 rounded-full flex-shrink-0"></div>
                      {editingParticipant === participant.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="font-display font-semibold text-neutral-900 bg-white border border-neutral-300 rounded px-2 py-1 flex-1"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleNameSave(participant.id);
                              if (e.key === 'Escape') setEditingParticipant(null);
                            }}
                            autoFocus
                          />
                          <button
                            onClick={() => handleNameSave(participant.id)}
                            className="text-green-600 hover:text-green-700 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setEditingParticipant(null)}
                            className="text-red-600 hover:text-red-700 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-1">
                          <h4 className="font-display font-semibold text-neutral-900 truncate">
                            {participant.name}
                          </h4>
                          <button
                            onClick={() => handleNameEdit(participant.id, participant.name)}
                            className="text-neutral-400 hover:text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
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

            {/* Add Participant Button */}
            <Button
              variant="outline"
              onClick={() => setShowAddParticipantModal(true)}
              className="w-full mt-4 border-dashed border-2 border-neutral-300 hover:border-primary-300 hover:bg-primary-50 transition-colors text-primary-600"
            >
              + Add Participant
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

      {/* Confirmation Section */}
      <div className="mt-8 border-t border-neutral-200 pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-display font-semibold text-neutral-900 mb-1">
              Ready to Schedule?
            </h3>
            <p className="text-sm text-neutral-600">
              {isReadyForConfirmation 
                ? `${getSelectedSlots().length} of ${participants.length} participants have selected times.`
                : `Please select a time slot for each participant (${getSelectedSlots().length}/${participants.length} selected).`
              }
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleExitClick}
              disabled={isConfirming}
              className="px-6"
            >
              Save for Later
            </Button>
            <Button
              onClick={handleConfirmSelections}
              disabled={!isReadyForConfirmation || isConfirming}
              className="px-6"
            >
              {isConfirming ? 'Confirming...' : 'Confirm & Schedule'}
            </Button>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      <ExitConfirmationModal
        isOpen={showExitModal}
        onCancel={handleExitCancel}
        onConfirm={handleExitConfirm}
      />

      {/* Add Participant Modal */}
      <AddParticipantModal
        isOpen={showAddParticipantModal}
        onClose={() => setShowAddParticipantModal(false)}
        onAdd={handleAddParticipant}
      />
    </div>
  );
}