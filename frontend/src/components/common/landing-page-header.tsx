import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CoffeeIcon } from '@/components/ui/coffee-icon';

export const LandingPageHeader = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-secondary-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <CoffeeIcon className="h-6 w-6 text-primary-700" />
              <span className="text-lg font-display font-semibold text-primary-800">
                Coffee Scheduler
              </span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/#how-it-works"
              className="text-sm font-body font-medium text-neutral-600 hover:text-primary-700 transition-colors"
            >
              How it brews
            </Link>
            <Button asChild size="sm">
              <Link href="/login">Start Brewing</Link>
            </Button>
          </nav>
          <div className="md:hidden">
            {/* Mobile menu button can be added here if needed */}
          </div>
        </div>
      </div>
    </header>
  );
};
