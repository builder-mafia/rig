import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import { Effect } from 'effect';
import { listSkills } from './api';
import type { Skill, SkillRoot } from './types';

const combineSkills = (queries: UseQueryResult<Skill[]>[]) => ({
  skills: queries.flatMap(query => query.data ?? []),
  isLoading: queries.some(query => query.isLoading),
  error: queries.find(query => query.error)?.error ?? null,
});

export const useFetchSkills = (roots: SkillRoot[]) => {
  return useQueries({
    queries: roots.map(root => ({
      queryKey: ['skills', root.id, root.path, root.exists],
      queryFn: () => Effect.runPromise(listSkills(root)),
    })),
    combine: combineSkills,
  });
};
