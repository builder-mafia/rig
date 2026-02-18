import { useQuery } from '@tanstack/react-query';
import { useService } from '@/business/ServiceContext';
import type { StorageChannel } from '@/lib/gateway/channel/types';

export const useChatFacadeCreation = (channel: StorageChannel) => {
  const { chatFacadeManager } = useService();
  const { data: chatFacade, error } = useQuery({
    queryKey: ['chatFacade', channel.id],
    queryFn: () => chatFacadeManager.getOrCreate(channel),
    staleTime: 60 * 1000 * 60 * 10, // 10 hour
  });

  return { chatFacade: chatFacade ?? null, error: error ?? null };
};
