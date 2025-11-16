import { useQuery } from '@tanstack/react-query';
import { DB } from './db';

/**
 * get the config from the database.
 *
 * if the config is changed, the query will be invalidated.
 */
export const useConfig = () => {
  return useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      return await DB.getConfig();
    },
  });
};
