import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UIMessage } from 'ai';
import { DB } from './db';

export const useMessageMutation = <UI_MESSAGE extends UIMessage>() => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      channelId,
      message,
    }: {
      channelId: string;
      message: UI_MESSAGE;
    }) => {
      return await DB.addMessage(channelId, message);
    },
    onSuccess: (_, { channelId }) => {
      queryClient.invalidateQueries({ queryKey: ['message', channelId] });
    },
  });
};
