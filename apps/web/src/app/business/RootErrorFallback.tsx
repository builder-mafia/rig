'use client';

import { isAssertionError } from '@allin/utils';
import { sortBy } from 'es-toolkit';
import { getDefaultStore } from 'jotai';
import type { FallbackProps } from 'react-error-boundary';
import { toast } from 'sonner';
import { dbAtoms } from '@/idb/db-store';

export function RootErrorFallback({
  error,
  resetErrorBoundary,
}: FallbackProps) {
  const onClickReset = async () => {
    if (isAssertionError(error)) {
      if (error.message.includes('selectedChannelId')) {
        const allChannels = await getDefaultStore().get(
          dbAtoms.allChannelsAtom,
        );
        const lastestChannel = sortBy(allChannels, [
          channel => -channel.updatedAt,
        ])[0];

        if (!lastestChannel) {
          toast.error('No channels found');
          return;
        }

        await getDefaultStore().set(
          dbAtoms.updateSelectedChannelIdAtom,
          lastestChannel.id,
        );
      }
    }

    resetErrorBoundary();
  };

  if (isAssertionError(error)) {
    return (
      <div className='flex flex-col items-center justify-center gap-3 p-4 text-sm'>
        <p className='font-medium'>An unexpected state was detected.</p>
        <p className='text-muted-foreground'>
          If the problem persists, please refresh and try again.
        </p>
        <button
          type='button'
          onClick={onClickReset}
          className='px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs'
        >
          Reset
        </button>
      </div>
    );
  }

  return (
    <div className='p-4 text-sm'>
      <p className='font-medium'>An error occurred.</p>
      <p className='mt-1 text-muted-foreground break-all'>
        {error.name}: {error.message}
      </p>
    </div>
  );
}
