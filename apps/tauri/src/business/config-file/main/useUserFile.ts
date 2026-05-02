import { useQuery } from '@tanstack/react-query';
import { useService } from '@/business/ServiceContext';

export const USE_USER_FILE_QUERY_KEY = ['user-file'];

export const useUserFile = () => {
  const { configFileManager } = useService();
  const { data } = useQuery({
    queryKey: ['user-file'],
    queryFn: () => configFileManager.fetchFiles(),
    initialData: [],
    staleTime: 1000 * 60 * 5,
  });

  return { data };
};
