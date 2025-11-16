import { useMutation } from '@tanstack/react-query';
import type z from 'zod';
import { type ChannelSchema, DB } from './db';

export const useChannelCreate = () => {
  return useMutation({
    mutationFn: async (channel: z.infer<typeof ChannelSchema>) => {
      return await DB.createChannel(channel);
    },
  });
};
