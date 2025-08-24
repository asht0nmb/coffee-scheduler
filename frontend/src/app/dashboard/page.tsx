'use client';

import { SidebarMenu } from '@/components/dashboard/sidebar-menu';
import { GoogleCalendarMock } from '@/components/dashboard/google-calendar-mock';
import { useModal } from '@/contexts/modal-context';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
  const { openNewEventModal } = useModal();
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Handle authentication state
  useEffect(() => {
    console.log('🎯 Dashboard auth state:', { 
      isLoading, 
      isAuthenticated, 
      hasUser: !!user,
      userEmail: user?.email 
    });

    if (!isLoading && !isAuthenticated) {
      console.log('❌ Dashboard: Not authenticated, redirecting to login');
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, user, router]);

  const handleNewEvent = () => {
    openNewEventModal();
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated (will redirect)
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-neutral-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

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