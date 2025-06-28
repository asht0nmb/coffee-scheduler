'use client';

import { useModal } from '@/contexts/modal-context';
import { useEffect } from 'react';

export const LoginModal = () => {
  const { isLoginModalOpen, closeLoginModal } = useModal();

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLoginModalOpen) {
        closeLoginModal();
      }
    };

    if (isLoginModalOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isLoginModalOpen, closeLoginModal]);

  if (!isLoginModalOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 'var(--z-modal)' }}>
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black backdrop-blur-sm"
        style={{ 
          opacity: 'var(--modal-backdrop-opacity)',
          backdropFilter: `blur(var(--modal-backdrop-blur))`
        }}
        onClick={closeLoginModal}
      />
      
      {/* Modal Content */}
      <div 
        className="relative bg-white border w-full mx-4"
        style={{
          maxWidth: 'var(--modal-max-width)',
          padding: 'var(--modal-padding)',
          borderRadius: 'var(--modal-radius)',
          boxShadow: 'var(--modal-shadow)',
          border: 'var(--modal-border)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={closeLoginModal}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-display font-bold text-neutral-900 mb-2">
            📅 Welcome to Scheduler
          </h1>
          <p className="font-body text-neutral-600">
            Sign in to start optimizing your meeting times
          </p>
        </div>

        {/* Google OAuth Button */}
        <div className="space-y-4">
          <button className="w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.1197 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
          
          <p className="text-xs font-body text-neutral-500 text-center">
            We&apos;ll redirect you to Google to sign in securely
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="mt-6 pt-4 border-t border-secondary-200">
          <p className="text-xs font-body text-neutral-500 text-center">
            By signing in, you agree to our terms of service and privacy policy
          </p>
        </div>
      </div>
    </div>
  );
};