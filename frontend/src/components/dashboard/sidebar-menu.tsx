'use client';

import { Button } from '@/components/ui/button';

interface SidebarMenuProps {
  onNewEvent?: () => void;
}

export const SidebarMenu = ({ onNewEvent }: SidebarMenuProps) => {
  return (
    <div className="bg-white border border-secondary-200 rounded-lg p-4 h-fit">
      <h3 className="text-lg font-display font-semibold text-neutral-900 mb-4">
        Menu
      </h3>
      
      <div className="space-y-3">
        {/* New Event Button */}
        <Button 
          onClick={onNewEvent}
          className="w-full justify-start"
          size="sm"
        >
          ✨ New Event
        </Button>
        
        {/* Previous Sessions */}
        <button className="w-full flex items-center justify-start px-3 py-2 text-sm font-body text-neutral-700 hover:bg-neutral-50 rounded-md transition-colors">
          📅 Previous
        </button>
        
        {/* Settings */}
        <button className="w-full flex items-center justify-start px-3 py-2 text-sm font-body text-neutral-700 hover:bg-neutral-50 rounded-md transition-colors">
          ⚙️ Settings
        </button>
      </div>
    </div>
  );
};