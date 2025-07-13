'use client';

import { useModal } from '@/contexts/modal-context';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SimplePopup } from '@/components/ui/simple-popup';
import { useRouter } from 'next/navigation';
import { 
  MAJOR_TIMEZONE_OPTIONS, 
  DEFAULT_TIMEZONE, 
  DEFAULT_DURATION,
  APP_CONSTANTS
} from '@/constants';
import { NewContact } from '@/lib/types';
import { useModalEscape } from '@/hooks/useModalEscape';

export const NewEventModal = () => {
  const { isNewEventModalOpen, closeNewEventModal } = useModal();
  const [contacts, setContacts] = useState<NewContact[]>([
    { id: '1', name: '', timezone: DEFAULT_TIMEZONE, email: '' }
  ]);
  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const [showNotification, setShowNotification] = useState(false);
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Use the reusable modal escape hook
  useModalEscape({
    isOpen: isNewEventModalOpen,
    onClose: closeNewEventModal,
  });

  const addContact = () => {
    const newId = Date.now().toString();
    setContacts([...contacts, { id: newId, name: '', timezone: DEFAULT_TIMEZONE, email: '' }]);
    
    // Auto-scroll to bottom when adding contact if in scroll mode
    setTimeout(() => {
      if (scrollContainerRef.current && contacts.length >= 4) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  const removeContact = (id: string) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter(c => c.id !== id));
    }
  };

  const updateContactName = (id: string, name: string) => {
    setContacts(contacts.map(c => 
      c.id === id ? { ...c, name } : c
    ));
  };

  const updateContactTimezone = (id: string, timezone: string) => {
    setContacts(contacts.map(c => 
      c.id === id ? { ...c, timezone } : c
    ));
  };

  const updateContactEmail = (id: string, email: string) => {
    setContacts(contacts.map(c => 
      c.id === id ? { ...c, email } : c
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form - only check contacts now
    const validContacts = contacts.filter(c => c.name.trim());
    if (validContacts.length === 0) {
      setShowNotification(true);
      return;
    }

    // Create scheduling session
    const sessionId = Date.now().toString();
    
    // TODO: Save session data to state/storage

    // Close modal and navigate to scheduling view
    closeNewEventModal();
    router.push(`/dashboard/scheduling/${sessionId}`);
    
    // Reset form
    setContacts([{ id: '1', name: '', timezone: DEFAULT_TIMEZONE, email: '' }]);
    setDuration(DEFAULT_DURATION);
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
          maxWidth: '48rem',
          padding: 'var(--modal-padding)',
          borderRadius: 'var(--modal-radius)',
          boxShadow: 'var(--modal-shadow)',
          border: 'var(--modal-border)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={closeNewEventModal}
          className="absolute top-3 right-3 p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:ring-offset-1"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">
            Schedule Chats
          </h2>
          {/* <p className="font-body text-neutral-600">
            Set up a new batch :)
          </p> */}
        </div>


        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contacts */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Contacts
            </label>
            <div className="space-y-3">
              {/* Header row - always visible */}
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-neutral-500">
                <div className="col-span-4">Name</div>
                <div className="col-span-3">Timezone</div>
                <div className="col-span-4">Email (optional)</div>
                <div className="col-span-1"></div>
              </div>
              
              {/* Scrollable contacts container - conditional based on count */}
              <div 
                className={`space-y-2 transition-all duration-200 ${
                  contacts.length > 4 
                    ? 'max-h-48 overflow-y-auto border border-neutral-200 rounded-md p-3 bg-neutral-50/30 scroll-smooth' 
                    : ''
                }`} 
                ref={scrollContainerRef}
                style={contacts.length > 4 ? { scrollBehavior: 'smooth' } : {}}
              >
                {contacts.map((contact, index) => (
                  <div key={contact.id} className="grid grid-cols-12 gap-2 items-center">
                    {/* Name */}
                    <div className="col-span-4">
                      <Input
                        value={contact.name}
                        onChange={(e) => updateContactName(contact.id, e.target.value)}
                        placeholder={`Contact ${index + 1}`}
                        className="text-sm h-9"
                      />
                    </div>
                    
                    {/* Timezone */}
                    <div className="col-span-3">
                      <select
                        value={contact.timezone}
                        onChange={(e) => updateContactTimezone(contact.id, e.target.value)}
                        className="w-full h-9 px-3 py-2 border border-neutral-300 rounded-md text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        {MAJOR_TIMEZONE_OPTIONS.map((tz) => (
                          <option key={tz.value} value={tz.value}>
                            {tz.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Email */}
                    <div className="col-span-4">
                      <Input
                        type="email"
                        value={contact.email || ''}
                        onChange={(e) => updateContactEmail(contact.id, e.target.value)}
                        placeholder="email@example.com"
                        className="text-sm h-9"
                      />
                    </div>
                    
                    {/* Remove button */}
                    <div className="col-span-1">
                      {contacts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeContact(contact.id)}
                          className="flex items-center justify-center w-9 h-9 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-offset-1"
                          aria-label={`Remove contact ${index + 1}`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Add Contact button - always visible with scroll indicator */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={addContact}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  + Add Contact
                </button>
                {contacts.length > 4 && (
                  <span className="text-xs text-neutral-500">
                    {contacts.length} contacts • Scroll to view all
                  </span>
                )}
              </div>
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

      {/* Simple Popup */}
      <SimplePopup
        show={showNotification}
        onHide={() => setShowNotification(false)}
        title="Missing contacts"
        message={APP_CONSTANTS.ERROR_VALIDATION}
        type="warning"
        duration={3000}
      />
    </div>
  );
};