import { LandingPageHeader } from '@/components/common/landing-page-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#F9F9F7]">
      <LandingPageHeader />
      <main className="flex-grow flex items-center justify-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-800 tracking-tight">
              Spend time <span className="text-[#00837a]">chatting</span>
              <br />
              not scheduling
            </h1>
            <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-gray-600">
              Provide options that fit your schedule and theirs. Integrates with
              your calendar.
            </p>
            <div className="mt-8 sm:mt-10">
              <Button asChild size="lg">
                <Link href="/login">Find times</Link>
              </Button>
            </div>
             <div className="mt-4 w-24 h-1 bg-[#00837a] mx-auto rounded-full" />
          </div>
        </div>
      </main>
    </div>
  );
}