import { HamburgerMenu } from '@/components/common/hamburger-menu';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Fixed Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-secondary-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-display font-semibold text-neutral-900">
                📅 Scheduler
              </h1>
              <span className="ml-4 text-sm font-body text-neutral-500">Dashboard</span>
            </div>
            <div className="flex items-center">
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