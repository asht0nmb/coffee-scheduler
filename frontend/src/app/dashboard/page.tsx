'use client';

import { SidebarMenu } from '@/components/dashboard/sidebar-menu';
import { GoogleCalendarMock } from '@/components/dashboard/google-calendar-mock';
import { useModal } from '@/contexts/modal-context';

export default function DashboardPage() {
  const { openNewEventModal } = useModal();

  const handleNewEvent = () => {
    openNewEventModal();
  };

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Menu */}
        <div className="lg:col-span-1">
          <SidebarMenu onNewEvent={handleNewEvent} />
        </div>
        
        {/* Calendar Integration */}
        <div className="lg:col-span-3">
          <GoogleCalendarMock />
        </div>
      </div>
    </div>
  );
}