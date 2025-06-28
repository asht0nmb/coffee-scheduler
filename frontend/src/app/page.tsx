import { LandingPageHeader } from '@/components/common/landing-page-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <LandingPageHeader />
      <main className="flex-grow flex items-center justify-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-neutral-900 tracking-tight">
              Spend time <span className="text-primary-600">connecting</span>
              <br />
              not scheduling
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl font-body text-neutral-600">
              Intelligent scheduling that finds optimal meeting times for you and your contacts. 
              Seamlessly integrates with your existing calendar.
            </p>
            <div className="mt-8 sm:mt-10">
              <Button asChild size="lg">
                <Link href="/login">Get Started</Link>
              </Button>
            </div>
             <div className="mt-4 w-24 h-1 bg-primary-500 mx-auto rounded-full" />
          </div>
        </div>
      </main>
    </div>
  );
}