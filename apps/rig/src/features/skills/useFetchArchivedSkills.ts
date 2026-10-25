import { useQueries } from '@tanstack/react-query';
import { Effect } from 'effect';
import { listArchivedSkills } from './api';
import type { SkillRoot } from './types';

export const useFetchArchivedSkills = (roots: SkillRoot[]) => {
  const skillQueries = useQueries({
    queries: roots.map(root => ({
      queryKey: ['archived-skills', root.path],
      queryFn: () => Effect.runPromise(listArchivedSkills(root.path)),
    })),
  });

  return {
    archivedSkills: skillQueries.flatMap((query, index) =>
      (query.data ?? []).map(skill => ({
        ...skill,
        scopeId: roots[index].scopeId,
        scopeLabel: roots[index].scopeLabel,
        scopeKind: roots[index].scopeKind,
        rootId: roots[index].id,
        rootLabel: roots[index].label,
        provider: roots[index].provider,
      })),
    ),
    isLoading: skillQueries.some(query => query.isLoading),
    error: skillQueries.find(query => query.error)?.error ?? null,
  };
};
