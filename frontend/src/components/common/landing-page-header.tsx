import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CoffeeIcon } from '@/components/ui/coffee-icon';

export const LandingPageHeader = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <CoffeeIcon className="h-6 w-6 text-gray-800" />
              <span className="text-lg font-semibold text-gray-800">
                CoffeeChat
              </span>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/#how-it-works"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              How it works
            </Link>
            <Button asChild size="sm">
              <Link href="/login">Sign in</Link>
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
