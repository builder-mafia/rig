'use client';

import { useI18n } from '@/lib/preferences';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Spinner,
} from '@allin/ui';
import { RefreshCw } from 'lucide-react';
import posthog from 'posthog-js';
import { useAppUpdate } from '../useAppUpdate';

export const AppUpdateDialog = () => {
  const { t } = useI18n();

  const appUpdate = useAppUpdate();
  const isBusy = appUpdate.isChecking || appUpdate.isInstalling;

  return (
    <Dialog open={appUpdate.isOpen} onOpenChange={appUpdate.setIsOpen}>
      <DialogContent closeLabel={t('Close')} showCloseButton={!isBusy}>
        <DialogHeader>
          <DialogTitle>{t(getTitle(appUpdate.status))}</DialogTitle>
          <DialogDescription>{t(getDescription(appUpdate))}</DialogDescription>
        </DialogHeader>

        {appUpdate.update != null && appUpdate.status === 'available' ? (
          <div className='rounded-lg border bg-muted/40 p-3 text-sm'>
            <div className='flex items-center justify-between gap-3'>
              <span className='text-muted-foreground'>
                {t('Current version')}
              </span>
              <span className='font-mono'>
                {appUpdate.update.currentVersion}
              </span>
            </div>
            <div className='mt-2 flex items-center justify-between gap-3'>
              <span className='text-muted-foreground'>{t('New version')}</span>
              <span className='font-mono font-medium'>
                {appUpdate.update.version}
              </span>
            </div>
          </div>
        ) : null}

        {appUpdate.errorMessage != null ? (
          <p className='rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive'>
            {appUpdate.errorMessage}
          </p>
        ) : null}

        <DialogFooter>
          {appUpdate.status === 'available' ? (
            <>
              <Button
                type='button'
                variant='outline'
                disabled={isBusy}
                onClick={() => appUpdate.setIsOpen(false)}
              >
                {t('Later')}
              </Button>
              <Button
                type='button'
                disabled={isBusy}
                onClick={() => {
                  posthog.capture('update_installed', {
                    current_version: appUpdate.update?.currentVersion,
                    new_version: appUpdate.update?.version,
                  });
                  appUpdate.installUpdate();
                }}
              >
                {appUpdate.isInstalling ? <Spinner /> : null}
                {t('Update now')}
              </Button>
            </>
          ) : (
            <>
              <Button
                type='button'
                variant='outline'
                disabled={isBusy}
                onClick={() => appUpdate.setIsOpen(false)}
              >
                {t('Close')}
              </Button>
              <Button
                type='button'
                disabled={isBusy}
                onClick={() => appUpdate.checkForUpdate({ openWhenNone: true })}
              >
                {appUpdate.isChecking ? <Spinner /> : <RefreshCw />}
                {t('Check again')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const getTitle = (status: ReturnType<typeof useAppUpdate>['status']) => {
  switch (status) {
    case 'checking':
      return 'Checking for updates';
    case 'available':
      return 'Update available';
    case 'notAvailable':
      return 'Rig is up to date';
    case 'installing':
      return 'Installing update';
    case 'error':
      return 'Update failed';
    case 'idle':
      return 'App updates';
  }
};

const getDescription = (appUpdate: ReturnType<typeof useAppUpdate>) => {
  switch (appUpdate.status) {
    case 'checking':
      return 'Looking for a newer version of Rig.';
    case 'available':
      return 'A new version is ready to install. Rig will restart after the update is installed.';
    case 'notAvailable':
      return 'You are already running the latest available version.';
    case 'installing':
      return 'Downloading and installing the update. Rig will restart automatically.';
    case 'error':
      return 'Rig could not complete the update. The detail below was also saved to the app log.';
    case 'idle':
      return 'Check whether a newer version of Rig is available.';
  }
};
