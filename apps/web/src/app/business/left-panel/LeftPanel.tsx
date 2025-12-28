import { Sidebar, SidebarContent, SidebarHeader, Skeleton } from '@allin/ui';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { match, P } from 'ts-pattern';
import { ChannelList } from './ChannelList';

type PanelId = 'channels' | string;

export const LeftPanel = () => {
  // TODO: Add panel switching logic when needed

  return (
    <Sidebar>
      <ErrorBoundary
        fallbackRender={({ error }) => (
          <div className='p-4'>Error: {error.message}</div>
        )}
      >
        <Suspense
          fallback={
            <>
              <SidebarHeader>
                <div className='w-full h-[24px]'></div>
              </SidebarHeader>
              <SidebarContent>
                <div className='w-full h-full flex flex-col gap-2 mt-4 px-2'>
                  {Array.from({ length: 10 }).map((_, index) => (
                    <Skeleton
                      key={`skeleton-${index}`}
                      className='w-full h-10 rounded-2xl'
                    />
                  ))}
                </div>
              </SidebarContent>
            </>
          }
        >
          <ChannelList />
        </Suspense>
      </ErrorBoundary>
    </Sidebar>
  );
};
