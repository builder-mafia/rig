'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { RootView } from './components/RootView';

const queryClient = new QueryClient();

export default function MainPage() {
  return (
    <div className='flex flex-row h-0 items-center justify-center min-h-screen max-sm:h-[100dvh] font-[family-name:var(--font-geist-sans)]'>
      <Toaster richColors duration={3000} />
      <QueryClientProvider client={queryClient}>
        <div className='w-full h-full'>
          <RootView />
        </div>
      </QueryClientProvider>
    </div>
  );
}
