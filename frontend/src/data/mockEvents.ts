import { Event } from '@/types/events';

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Team Coffee Chat',
    participants: ['John Smith'],
    date: new Date(2025, 5, 15, 14, 0), // June 15, 2025 at 2:00 PM
    status: 'completed',
    duration: 30,
    finalTimeSlot: 'Mon 2-3pm',
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
    createdAt: new Date(2025, 4, 20),
    updatedAt: new Date(2025, 4, 25)
  },
  {
    id: '7',
    title: 'Product Planning Meeting',
    participants: ['David Park', 'Emma Wilson'],
    date: new Date(2025, 4, 22, 9, 0), // May 22, 2025 at 9:00 AM
    status: 'completed',
    duration: 60,
    finalTimeSlot: 'Wed 9-10am',
    createdAt: new Date(2025, 4, 18),
    updatedAt: new Date(2025, 4, 22)
  },
  {
    id: '8',
    title: 'Design Review',
    participants: ['Sophie Chen', 'Marcus Rodriguez', 'Olivia Thompson'],
    date: new Date(2025, 4, 18, 14, 30), // May 18, 2025 at 2:30 PM
    status: 'completed',
    duration: 90,
    finalTimeSlot: 'Sat 2:30-4:00pm',
    createdAt: new Date(2025, 4, 15),
    updatedAt: new Date(2025, 4, 18)
  },
  {
    id: '9',
    title: 'Client Onboarding',
    participants: ['James Kim', 'Rachel Adams'],
    date: new Date(2025, 4, 15, 10, 0), // May 15, 2025 at 10:00 AM
    status: 'completed',
    duration: 45,
    finalTimeSlot: 'Wed 10-10:45am',
    createdAt: new Date(2025, 4, 12),
    updatedAt: new Date(2025, 4, 15)
  },
  {
    id: '10',
    title: 'Sprint Retrospective',
    participants: ['Thomas Lee', 'Isabella Garcia', 'Kevin Martinez', 'Ava Singh'],
    date: new Date(2025, 4, 12, 16, 0), // May 12, 2025 at 4:00 PM
    status: 'completed',
    duration: 60,
    finalTimeSlot: 'Sun 4-5pm',
    createdAt: new Date(2025, 4, 8),
    updatedAt: new Date(2025, 4, 12)
  }
];