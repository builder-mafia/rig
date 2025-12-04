import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Skeleton } from '@/components/ui/skeleton';
import { ChannelTitle } from './ChannelTitle';

export const CenterHeader = () => {
  return (
    <div className='w-full flex absolute justify-center z-10 h-12'>
      <div className='mt-1'>
        <ErrorBoundary
          fallbackRender={({ error }) => <div>Error: {error.message}</div>}
        >
          <Suspense
            fallback={<Skeleton className='rounded-2xl w-[200px] border h-8' />}
          >
            <ChannelTitle />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
};
