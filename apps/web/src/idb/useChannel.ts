import { useQuery } from '@tanstack/react-query';
import { DB } from './db';

export const useChannel = (channelId: string) => {
  return useQuery({
    queryKey: ['channel', channelId],
    queryFn: async () => {
      return await DB.getChannel(channelId);
    },
  });
};
