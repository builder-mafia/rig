import { useMutation, useQueryClient } from '@tanstack/react-query';
import type z from 'zod';
import { type ChannelSchema, DB } from './db';

export const useChannelMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      channel,
    }: {
      id: string;
      channel: Partial<z.infer<typeof ChannelSchema>>;
    }) => {
      return await DB.updateChannel(id, channel);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['channel', id] });
    },
  });
};
