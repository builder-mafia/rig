'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { useDBSnapshot } from '@/idb/useDBSnapshot';
import { assertDefined } from '@/utils/assertDefined';
import { RootView } from './components/RootView';

const queryClient = new QueryClient();

export default function MainPage() {
  const { isLoading, error, snapshot } = useDBSnapshot();

  return (
    <div className='flex flex-row h-0 items-center justify-center min-h-screen max-sm:h-[100dvh] font-[family-name:var(--font-geist-sans)]'>
      <Toaster richColors duration={3000} />
      <QueryClientProvider client={queryClient}>
        <div className='w-full h-full'>
          {isLoading ? (
            <div></div>
          ) : (
            assertDefined(snapshot, 'snapshot is not defined') && (
              <RootView initialData={snapshot} />
            )
          )}
          {error && <div>Error: {error.message}</div>}
        </div>
      </QueryClientProvider>
    </div>
  );
}
