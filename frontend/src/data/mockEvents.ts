import { Event } from '@/types/events';

export const mockEvents: Event[] = [
  // Past Events
  {
    id: '1',
    title: 'Team Coffee Chat',
    participants: ['John Smith'],
    date: new Date(2025, 5, 15, 14, 0), // June 15, 2025 at 2:00 PM
    status: 'completed',
    duration: 30,
    finalTimeSlot: 'Mon 2-3pm',
    type: 'coffee_chat',
    createdAt: new Date(2025, 5, 10),
    updatedAt: new Date(2025, 5, 15)
  },
  {
    id: '2',
    title: 'Project Kickoff Meeting',
    participants: ['Sarah Johnson'],
    date: new Date(2025, 5, 12, 10, 30), // June 12, 2025 at 10:30 AM
    status: 'completed',
    duration: 45,
    finalTimeSlot: 'Thu 10:30-11:15am',
    type: 'regular',
    createdAt: new Date(2025, 5, 8),
    updatedAt: new Date(2025, 5, 12)
  },
  {
    id: '3',
    title: 'Client Demo Prep',
    participants: ['Mike Chen'],
    date: new Date(2025, 5, 8, 15, 15), // June 8, 2025 at 3:15 PM
    status: 'cancelled',
    duration: 60,
    finalTimeSlot: 'Sun 3:15-4:15pm',
    type: 'regular',
    createdAt: new Date(2025, 5, 5),
    updatedAt: new Date(2025, 5, 8)
  },
  {
    id: '4',
    title: 'Quarterly Review',
    participants: ['Emily Davis'],
    date: new Date(2025, 5, 5, 11, 0), // June 5, 2025 at 11:00 AM
    status: 'completed',
    duration: 30,
    finalTimeSlot: 'Wed 11-12pm',
    type: 'regular',
    createdAt: new Date(2025, 5, 1),
    updatedAt: new Date(2025, 5, 5)
  },
  {
    id: '5',
    title: 'Team Building Session',
    participants: ['Alex Wilson'],
    date: new Date(2025, 4, 28, 16, 30), // May 28, 2025 at 4:30 PM
    status: 'completed',
    duration: 30,
    finalTimeSlot: 'Tue 4:30-5:00pm',
    type: 'regular',
    createdAt: new Date(2025, 4, 25),
    updatedAt: new Date(2025, 4, 28)
  },
  {
    id: '6',
    title: 'Marketing Strategy Session',
    participants: ['Lisa Brown'],
    date: new Date(2025, 4, 25, 13, 45), // May 25, 2025 at 1:45 PM
    status: 'cancelled',
    duration: 45,
    finalTimeSlot: 'Sat 1:45-2:30pm',
    type: 'regular',
    createdAt: new Date(2025, 4, 20),
    updatedAt: new Date(2025, 4, 25)
  },
  
  // Upcoming Events
  {
    id: '11',
    title: 'Team Sync',
    participants: ['John Doe', 'Jane Smith'],
    date: new Date(2025, 6, 18, 9, 0), // July 18, 2025 at 9:00 AM
    status: 'scheduled',
    duration: 60,
    finalTimeSlot: 'Fri 9-10am',
    type: 'regular',
    createdAt: new Date(2025, 6, 10),
    updatedAt: new Date(2025, 6, 10)
  },
  {
    id: '12',
    title: 'Coffee with Sarah',
    participants: ['Sarah Wilson'],
    date: new Date(2025, 6, 20, 14, 0), // July 20, 2025 at 2:00 PM
    status: 'scheduled',
    duration: 30,
    finalTimeSlot: 'Sun 2-2:30pm',
    type: 'coffee_chat',
    createdAt: new Date(2025, 6, 12),
    updatedAt: new Date(2025, 6, 12)
  },
  {
    id: '13',
    title: 'Project Review',
    participants: ['Mike Johnson', 'Emily Chen'],
    date: new Date(2025, 6, 22, 11, 0), // July 22, 2025 at 11:00 AM
    status: 'scheduled',
    duration: 45,
    finalTimeSlot: 'Tue 11-11:45am',
    type: 'regular',
    createdAt: new Date(2025, 6, 14),
    updatedAt: new Date(2025, 6, 14)
  },
  {
    id: '14',
    title: 'Coffee Break Chat',
    participants: ['Alex Thompson'],
    date: new Date(2025, 6, 25, 15, 30), // July 25, 2025 at 3:30 PM
    status: 'scheduled',
    duration: 30,
    finalTimeSlot: 'Fri 3:30-4pm',
    type: 'coffee_chat',
    createdAt: new Date(2025, 6, 16),
    updatedAt: new Date(2025, 6, 16)
  },
  {
    id: '15',
    title: 'Weekly Standup',
    participants: ['Team Alpha'],
    date: new Date(2025, 6, 28, 10, 0), // July 28, 2025 at 10:00 AM
    status: 'scheduled',
    duration: 30,
    finalTimeSlot: 'Mon 10-10:30am',
    type: 'regular',
    createdAt: new Date(2025, 6, 18),
    updatedAt: new Date(2025, 6, 18)
  },
  {
    id: '16',
    title: 'Client Presentation',
    participants: ['David Kim', 'Lisa Rodriguez', 'Tom Wilson'],
    date: new Date(2025, 7, 2, 14, 0), // August 2, 2025 at 2:00 PM
    status: 'scheduled',
    duration: 90,
    finalTimeSlot: 'Sat 2-3:30pm',
    type: 'regular',
    createdAt: new Date(2025, 6, 20),
    updatedAt: new Date(2025, 6, 20)
  }
];