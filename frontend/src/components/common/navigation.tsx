'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Contacts', href: '/dashboard/contacts' },
  { name: 'Scheduling', href: '/dashboard/scheduling' },
  { name: 'Results', href: '/dashboard/results' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-semibold text-gray-900">
              ☕ Coffee Scheduler
            </Link>
          </div>
          
          <div className="flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-blue-600',
                  pathname === item.href
                    ? 'text-blue-600'
                    : 'text-gray-500'
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
          
          <div className="flex items-center">
            <span className="text-sm text-gray-500">User Profile</span>
          </div>
        </div>
      </div>
    </nav>
  );
}