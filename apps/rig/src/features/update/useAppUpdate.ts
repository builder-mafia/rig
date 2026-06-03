import { useMutation } from '@tanstack/react-query';
import { listen } from '@tauri-apps/api/event';
import { Effect } from 'effect';
import { useEffect, useState } from 'react';
import { fetchUpdate, installUpdate } from './api';
import type { UpdateMetadata } from './types';

const OPEN_APP_UPDATE_EVENT = 'open-app-update';

type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'notAvailable'
  | 'installing'
  | 'error';

interface CheckUpdateOptions {
  openWhenNone?: boolean;
}

export const useAppUpdate = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [update, setUpdate] = useState<UpdateMetadata | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const checkMutation = useMutation({
    mutationFn: (_options: CheckUpdateOptions = {}) =>
      Effect.runPromise(fetchUpdate()),
    onMutate: () => {
      setStatus('checking');
      setErrorMessage(null);
    },
    onSuccess: (nextUpdate, options) => {
      setUpdate(nextUpdate);

      if (nextUpdate == null) {
        setStatus('notAvailable');
        setIsOpen(options?.openWhenNone === true);
        return;
      }

      setStatus('available');
      setIsOpen(true);
    },
    onError: (error, options) => {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setIsOpen(options?.openWhenNone === true);
    },
  });

  const installMutation = useMutation({
    mutationFn: () => Effect.runPromise(installUpdate()),
    onMutate: () => {
      setStatus('installing');
      setErrorMessage(null);
    },
    onError: error => {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : String(error));
    },
  });

  const checkForUpdate = (options: CheckUpdateOptions = {}) => {
    if (options.openWhenNone === true) {
      setIsOpen(true);
    }

    checkMutation.mutate(options);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void checkForUpdate();

    const unlistenPromise = listen(OPEN_APP_UPDATE_EVENT, () => {
      checkForUpdate({ openWhenNone: true });
    });

    return () => {
      void unlistenPromise.then(unlisten => unlisten());
    };
  }, []);

  return {
    isOpen,
    setIsOpen,
    status,
    update,
    errorMessage,
    checkForUpdate,
    installUpdate: installMutation.mutate,
    isChecking: checkMutation.isPending,
    isInstalling: installMutation.isPending,
  };
};
