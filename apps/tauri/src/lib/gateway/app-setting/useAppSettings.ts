import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appSettingGateway } from './appSettingGateway';
import type { StorageAppSettings } from './types';

const appSettingKeys = {
  all: ['appSettings'] as const,
};

export const useAppSettings = () => {
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: appSettingKeys.all,
    queryFn: () => appSettingGateway.get(),
  });

  const saveSettings = useMutation({
    mutationFn: (updated: StorageAppSettings) =>
      appSettingGateway.save(updated),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: appSettingKeys.all }),
  });

  const saveFontFamily = useMutation({
    mutationFn: async (fontFamily: string | null) => {
      const current = await appSettingGateway.get();
      return appSettingGateway.save({
        ...current,
        fontFamily,
        updatedAt: Date.now(),
      });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: appSettingKeys.all }),
  });

  return {
    settings,
    saveSettings,
    saveFontFamily,
  };
};
