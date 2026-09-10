'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--sb-bg)]">
      <div className="neo-box p-6 text-center animate-pulse">
        <h2 className="text-xl font-bold">Loading Second Brain...</h2>
      </div>
    </div>
  );
}
