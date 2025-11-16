import { useQuery } from '@tanstack/react-query';
import { DB } from './db';

export const useMessages = (channelId: string) => {
  return useQuery({
    queryKey: ['message', channelId],
    queryFn: async () => {
      return await DB.getMessagesByChannelId(channelId);
    },
  });
};
