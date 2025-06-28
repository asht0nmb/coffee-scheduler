'use client';

import { useModal } from '@/contexts/modal-context';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

interface Participant {
  id: string;
  name: string;
}

export const NewEventModal = () => {
  const { isNewEventModalOpen, closeNewEventModal } = useModal();
  const [eventTitle, setEventTitle] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([
    { id: '1', name: '' }
  ]);
  const [duration, setDuration] = useState(30);
  const router = useRouter();

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isNewEventModalOpen) {
        closeNewEventModal();
      }
    };

    if (isNewEventModalOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isNewEventModalOpen, closeNewEventModal]);

  const addParticipant = () => {
    const newId = Date.now().toString();
    setParticipants([...participants, { id: newId, name: '' }]);
  };

  const removeParticipant = (id: string) => {
    if (participants.length > 1) {
      setParticipants(participants.filter(p => p.id !== id));
    }
  };

  const updateParticipantName = (id: string, name: string) => {
    setParticipants(participants.map(p => 
      p.id === id ? { ...p, name } : p
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!eventTitle.trim()) {
      alert('Please enter an event title');
      return;
    }
    
    const validParticipants = participants.filter(p => p.name.trim());
    if (validParticipants.length === 0) {
      alert('Please add at least one participant');
      return;
    }

    // Create scheduling session
    const sessionId = Date.now().toString();
    
    // TODO: Save session data to state/storage
    console.log('Creating session:', {
      id: sessionId,
      title: eventTitle,
      participants: validParticipants,
      duration
    });

    // Close modal and navigate to scheduling view
    closeNewEventModal();
    router.push(`/dashboard/scheduling/${sessionId}`);
    
    // Reset form
    setEventTitle('');
    setParticipants([{ id: '1', name: '' }]);
    setDuration(30);
  };

  if (!isNewEventModalOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 'var(--z-modal)' }}>
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black backdrop-blur-sm"
        style={{ 
          opacity: 'var(--modal-backdrop-opacity)',
          backdropFilter: `blur(var(--modal-backdrop-blur))`
        }}
        onClick={closeNewEventModal}
      />
      
      {/* Modal Content */}
      <div 
        className="relative bg-white border w-full mx-4"
        style={{
          maxWidth: '32rem',
          padding: 'var(--modal-padding)',
          borderRadius: 'var(--modal-radius)',
          boxShadow: 'var(--modal-shadow)',
          border: 'var(--modal-border)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={closeNewEventModal}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">
            Create New Event
          </h2>
          <p className="font-body text-neutral-600">
            Set up a new scheduling session with your participants
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Title */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Event Title
            </label>
            <Input
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="e.g., Team Coffee Chat"
              required
            />
          </div>

          {/* Participants */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Participants
            </label>
            <div className="space-y-3">
              {participants.map((participant, index) => (
                <div key={participant.id} className="flex items-center space-x-2">
                  <Input
                    value={participant.name}
                    onChange={(e) => updateParticipantName(participant.id, e.target.value)}
                    placeholder={`Participant ${index + 1} name`}
                    className="flex-1"
                  />
                  {participants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeParticipant(participant.id)}
                      className="text-neutral-400 hover:text-red-500 transition-colors"
                    >
                      ❌
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addParticipant}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                + Add Participant
              </button>
            </div>
          </div>

          {/* Meeting Duration */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Meeting Duration (minutes)
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
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

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={closeNewEventModal} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Create Schedule
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};