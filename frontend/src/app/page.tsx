import { LandingPageHeader } from '@/components/common/landing-page-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-secondary-50">
      <LandingPageHeader />
      <main className="flex-grow flex items-center justify-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-neutral-800 tracking-tight">
              Brew perfect <span className="text-primary-700">coffee meetings</span>
              <br />
              not scheduling chaos
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl font-body text-neutral-600">
              Smart scheduling that finds the perfect time for meaningful coffee chats. 
              Integrates seamlessly with your calendar and theirs.
            </p>
            <div className="mt-8 sm:mt-10">
              <Button asChild size="lg">
                <Link href="/login">Start Brewing Connections</Link>
              </Button>
            </div>
             <div className="mt-4 w-24 h-1 bg-accent-500 mx-auto rounded-full" />
          </div>
        </div>
      </main>
    </div>
  );
}