import { useLayoutEffect, useState } from 'react';
import type z from 'zod';
import {
  type ChannelSchema,
  type ConfigSchema,
  DB,
  type DB_MESSAGE,
} from './db';

export const useDBSnapshot = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [snapshot, setSnapshot] = useState<{
    channels: z.infer<typeof ChannelSchema>[];
    messages: DB_MESSAGE[];
    config: z.infer<typeof ConfigSchema>;
  } | null>(null);

  useLayoutEffect(() => {
    const getSnapshot = async () => {
      try {
        const snapshot = await DB.getSnapshot();

        setSnapshot(snapshot);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    getSnapshot();
  }, []);

  return {
    isLoading,
    error,
    snapshot,
  };
};
