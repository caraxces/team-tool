'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { state } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until the authentication state is initialized from localStorage
    if (state.token !== null || localStorage.getItem('token') === null) {
      if (state.isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [state.isAuthenticated, state.token, router]);

  // Render a loading spinner or a blank page while redirecting
  return (
    <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-black">
      {/* You can add a spinner here */}
      <div>Loading...</div>
    </div>
  );
}
