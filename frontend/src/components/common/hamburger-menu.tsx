'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface HamburgerMenuProps {
  className?: string;
}

export function HamburgerMenu({ className = '' }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleMenuItemClick = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  const handleSignOut = () => {
    setIsOpen(false);
    // TODO: Implement sign out logic
  };

  const menuItems = [
    { 
      label: 'Upcoming Events', 
      href: '/dashboard/events?view=upcoming',
      icon: '📅'
    },
    { 
      label: 'Past Events', 
      href: '/dashboard/events?view=past',
      icon: '📝'
    },
    { 
      label: 'Settings', 
      href: '/dashboard/settings',
      icon: '⚙️'
    }
  ];

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
        aria-label="Open menu"
        aria-expanded={isOpen}
      >
        <svg 
          className="w-5 h-5 text-neutral-600" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 6h16M4 12h16M4 18h16" 
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-neutral-200 rounded-lg shadow-lg z-50">
          <div className="py-2">
            {/* Menu Items */}
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleMenuItemClick(item.href)}
                className="w-full flex items-center px-4 py-3 text-left text-sm font-body transition-colors text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 cursor-pointer"
              >
                <span className="mr-3 text-base">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}

            {/* Divider */}
            <div className="my-2 border-t border-neutral-200"></div>

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-4 py-3 text-left text-sm font-body text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
            >
              <span className="mr-3 text-base">🚪</span>
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}