import { useMutation, useQueryClient } from '@tanstack/react-query';
import type z from 'zod';
import { type ConfigSchema, DB } from './db';

export const useConfigMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Partial<z.infer<typeof ConfigSchema>>) => {
      return await DB.updateConfig(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
    },
  });
};
