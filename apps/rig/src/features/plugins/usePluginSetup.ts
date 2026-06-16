import { toast } from '@allin/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Effect } from 'effect';
import { useState } from 'react';
import {
  InstallPluginTargetError,
  installPluginTarget,
  listPluginTargets,
} from './api';
import type { PluginInstallError, PluginTarget, PluginToolId } from './types';

const pluginTargetsQueryKey = ['plugin-targets'] as const;

export const usePluginSetup = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpenState] = useState(false);
  const pluginTargetsQuery = useQuery({
    queryKey: pluginTargetsQueryKey,
    queryFn: () => Effect.runPromise(listPluginTargets()),
  });
  const pluginTargets = pluginTargetsQuery.data ?? [];

  const hasIncompletePlugin = pluginTargets.some(target => !target.isInstalled);

  const installPluginMutation = useMutation({
    mutationFn: (pluginId: PluginToolId) =>
      Effect.runPromise(installPluginTarget(pluginId)),
    onSuccess: updatedTarget => {
      queryClient.setQueryData<PluginTarget[]>(
        pluginTargetsQueryKey,
        currentTargets =>
          currentTargets?.map(target =>
            target.id === updatedTarget.id ? updatedTarget : target,
          ) ?? [updatedTarget],
      );

      toast.success(`${updatedTarget.name} plugin installed`, {
        description: 'Restart the agent if needed.',
      });
    },
    onError: error => {
      const pluginError = getPluginInstallError(error);
      toast.error(pluginError?.message ?? 'Plugin installation failed', {
        description: pluginError?.details ?? getErrorMessage(error),
      });
    },
  });

  const setIsOpen = (nextIsOpen: boolean) => setIsOpenState(nextIsOpen);

  const openPluginSetup = () => setIsOpenState(true);

  const installPlugin = (pluginId: PluginToolId) => {
    installPluginMutation.mutate(pluginId);
  };

  const checkAgain = () => {
    void pluginTargetsQuery.refetch();
  };

  return {
    isOpen,
    setIsOpen,
    openPluginSetup,
    pluginTargets,
    installPlugin,
    checkAgain,
    hasIncompletePlugin,
    isChecking: pluginTargetsQuery.isFetching,
    errorMessage: pluginTargetsQuery.error
      ? getErrorMessage(pluginTargetsQuery.error)
      : null,
    installingPluginId: installPluginMutation.variables ?? null,
    isInstalling: installPluginMutation.isPending,
  };
};

const getPluginInstallError = (error: unknown) => {
  if (
    error instanceof InstallPluginTargetError &&
    error.kind === 'PluginInstallError'
  ) {
    return error.cause as PluginInstallError;
  }

  return null;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};
