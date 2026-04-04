'use client';

import { Button, CommandDialog, CommandList, toast } from '@allin/ui';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useCommandPalette } from '@/business/command-palette/useCommandPalette';
import type { AppUpdateMetadata } from '@/lib/gateway/app-update/types';
import { useAppUpdate } from '@/lib/gateway/app-update/useAppUpdate';

export const AppUpdateView = () => {
  const { close } = useCommandPalette();
  const { checkForUpdate, installUpdate } = useAppUpdate();
  const [availableUpdate, setAvailableUpdate] =
    useState<AppUpdateMetadata | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    'Check the update server for a newer ALLIN build.',
  );
  const isPending = checkForUpdate.isPending || installUpdate.isPending;

  const handleOpenChange = (open: boolean) => {
    if (!open && !isPending) {
      close();
    }
  };

  const handleCheck = () => {
    checkForUpdate.mutate(undefined, {
      onSuccess: update => {
        if (!update) {
          setAvailableUpdate(null);
          setStatusMessage('You are already on the latest version.');
          toast.success('No updates found', {
            position: 'top-center',
            duration: 3000,
          });
          return;
        }

        setAvailableUpdate(update);
        setStatusMessage(
          `Update ${update.version} is available. Current version is ${update.currentVersion}.`,
        );
        toast.success(`Update ${update.version} is available`, {
          position: 'top-center',
          duration: 3000,
        });
      },
      onError: error => {
        setAvailableUpdate(null);
        setStatusMessage(error.message);
        toast.error(error.message, {
          position: 'top-center',
          duration: 15000,
          closeButton: true,
        });
      },
    });
  };

  const handleInstall = () => {
    installUpdate.mutate(undefined, {
      onSuccess: () => {
        toast.success('Update installed. Restart ALLIN to apply it.', {
          position: 'top-center',
          duration: 5000,
        });
        close();
      },
      onError: error => {
        toast.error(error.message, {
          position: 'top-center',
          duration: 15000,
          closeButton: true,
        });
      },
    });
  };

  return (
    <CommandDialog open onOpenChange={handleOpenChange} showCloseButton={false}>
      <CommandList>
        <div className='p-4 flex flex-col gap-4'>
          <div className='flex flex-col gap-1'>
            <h3 className='font-semibold'>App Update</h3>
            <p className='text-sm text-muted-foreground'>{statusMessage}</p>
          </div>
          <div className='flex justify-end gap-2'>
            <Button size='sm' variant='outline' onClick={handleCheck}>
              {checkForUpdate.isPending ? (
                <Loader2 className='size-4 animate-spin' />
              ) : (
                'Check Now'
              )}
            </Button>
            <Button
              size='sm'
              onClick={handleInstall}
              disabled={!availableUpdate || isPending}
            >
              {installUpdate.isPending ? (
                <Loader2 className='size-4 animate-spin' />
              ) : (
                'Install Update'
              )}
            </Button>
          </div>
          <p className='text-xs text-muted-foreground'>Can not load.</p>
        </div>
      </CommandList>
    </CommandDialog>
  );
};
