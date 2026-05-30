import { useQuery } from '@tanstack/react-query';
import { Effect } from 'effect';
import { listSkillRoots } from './api';

export const skillRootsQueryKey = ['skill-roots'] as const;

export const useSkillRoots = () => {
  return useQuery({
    queryKey: skillRootsQueryKey,
    queryFn: () => Effect.runPromise(listSkillRoots()),
  });
};
