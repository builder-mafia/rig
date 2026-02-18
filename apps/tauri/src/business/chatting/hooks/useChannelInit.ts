import { useEffect, useState } from 'react';
import { useService } from '@/business/ServiceContext';

export const useChannelInit = () => {
  const { channelManager } = useService();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    channelManager
      .fetchChannels()
      .catch(e => setError(e instanceof Error ? e : new Error(String(e))))
      .finally(() => setIsLoading(false));
  }, [channelManager]);

  return { isLoading, error };
};
