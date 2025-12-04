import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Sidebar } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { ChannelList } from './ChannelList';

export const LeftPanel = () => {
  return (
    <Sidebar>
      <ErrorBoundary
        fallbackRender={({ error }) => <div>Error: {error.message}</div>}
      >
        <Suspense
          fallback={
            <div className='w-full h-full flex flex-col gap-2 mt-16 px-2 overflow-hidden'>
              {Array.from({ length: 10 }).map((_, index) => (
                <Skeleton key={index} className='w-full h-10 rounded-2xl' />
              ))}
            </div>
          }
        >
          <ChannelList />
        </Suspense>
      </ErrorBoundary>
    </Sidebar>
  );
};
