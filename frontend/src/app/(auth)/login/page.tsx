'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useModal } from '@/contexts/modal-context';

export default function LoginPage() {
  const router = useRouter();
  const { openLoginModal } = useModal();

  useEffect(() => {
    // Redirect to home and open the login modal
    router.replace('/');
    openLoginModal();
  }, [router, openLoginModal]);

  // Show a loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-neutral-600 font-body">Redirecting...</p>
      </div>
    </div>
  );
}