'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { ModalRegistry } from './components/modal/ModalRegistry';

const queryClient = new QueryClient();

/**
 * In SSR, we can't use IDB.
 */
const DynamicRootViewRenderer = dynamic(
  () =>
    import('./components/RootViewRenderer').then(
      module => module.RootViewRenderer,
    ),
  {
    ssr: false,
  },
);

export default function MainPage() {
  return (
    <div className='flex flex-row h-0 items-center justify-center min-h-screen max-sm:h-[100dvh] font-[family-name:var(--font-geist-sans)]'>
      <Toaster richColors duration={3000} />
      <QueryClientProvider client={queryClient}>
        <div className='w-full h-full'>
          <Suspense fallback={<div>Loading...</div>}>
            <DynamicRootViewRenderer />
          </Suspense>
        </div>
        <ModalRegistry />
      </QueryClientProvider>
    </div>
  );
}
