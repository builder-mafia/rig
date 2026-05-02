import { useMutation, useQuery } from '@tanstack/react-query';
import { configFileGateway } from '@/lib/gateway/config-file/configFileGateway';
import type { StorageGroup } from '@/lib/gateway/config-file/types';
import { queryClient } from '@/lib/queryClient';

export const useGroup = () => {
  const groups = useQuery({
    queryKey: ['groups'],
    queryFn: () => configFileGateway.getGroups(),
    initialData: [],
  });
  const { createGroup, createGroups, updateGroup, deleteGroup } = useSetGroup();

  return { groups, createGroup, createGroups, updateGroup, deleteGroup };
};

export const useSetGroup = () => {
  const createGroup = useMutation({
    mutationFn: (group: StorageGroup) => configFileGateway.createGroup(group),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });

  const createGroups = useMutation({
    mutationFn: (groups: StorageGroup[]) =>
      Promise.all(groups.map(group => configFileGateway.createGroup(group))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  });

  const updateGroup = useMutation({
    mutationFn: (group: StorageGroup) => configFileGateway.updateGroup(group),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  });

  const deleteGroup = useMutation({
    mutationFn: (id: string) => configFileGateway.deleteGroup(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  });

  return { createGroup, createGroups, updateGroup, deleteGroup };
};
