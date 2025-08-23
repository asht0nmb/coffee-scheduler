'use client';

import { HamburgerMenu } from '@/components/common/hamburger-menu';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Fixed Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-secondary-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button 
                onClick={() => router.push('/dashboard')}
                className="text-xl font-display font-semibold text-neutral-900 transition-colors cursor-pointer"
              >
                📅 Scheduler
              </button>
              <span className="ml-4 text-sm font-body text-neutral-500">Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-3">
                  {user.picture && (
                    <Image 
                      src={user.picture} 
                      alt={user.name}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div className="hidden sm:block text-sm">
                    <div className="font-medium text-neutral-900">{user.name}</div>
                    <div className="text-neutral-500">{user.email}</div>
                  </div>
                  <Button
                    onClick={logout}
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                    className="text-neutral-600 hover:text-neutral-900"
                  >
                    {isLoading ? 'Logging out...' : 'Logout'}
                  </Button>
                </div>
              )}
              <HamburgerMenu />
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main content with top padding for fixed nav */}
      <main className="max-w-7xl mx-auto pt-20 pb-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}