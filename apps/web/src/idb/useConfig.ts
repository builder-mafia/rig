import { useQuery } from '@tanstack/react-query';
import { DB } from './db';

export const useConfig = () => {
  return useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      return await DB.getConfig();
    },
  });
};
