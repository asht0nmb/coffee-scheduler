export interface Event {
  id: string;
  title: string;
  participants: string[];
  date: Date;
  status: 'completed' | 'cancelled' | 'scheduled';
  duration: number;
  finalTimeSlot: string;
  type?: 'regular' | 'coffee_chat';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EventSummary {
  id: string;
  participantName: string;
  date: string;
  time: string;
  completed: boolean;
}

// Utility function to convert Event to EventSummary for sidebar display
export const eventToSummary = (event: Event): EventSummary => ({
  id: event.id,
  participantName: event.participants.length === 1 
    ? event.participants[0] 
    : `${event.participants[0]} +${event.participants.length - 1} others`,
  date: event.date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }),
  time: event.date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }),
  completed: event.status === 'completed'
});