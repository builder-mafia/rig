import { useQueries, type UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Effect } from 'effect';
import { listArchivedSkills } from './api';
import type { Skill, SkillRoot } from './types';

const combineArchivedSkills = (queries: UseQueryResult<Skill[]>[]) => ({
  archivedSkills: queries.flatMap(query => query.data ?? []),
  isLoading: queries.some(query => query.isLoading),
  error: queries.find(query => query.error)?.error ?? null,
});

export const useFetchArchivedSkills = (
  roots: SkillRoot[],
  includeContent = true,
) => {
  const queries = useMemo(
    () =>
      roots.map(root => ({
        queryKey: ['archived-skills', root.path, includeContent],
        queryFn: () =>
          Effect.runPromise(listArchivedSkills(root.path, includeContent)),
        // Full archive bodies are needed only while the Hidden view is mounted.
        gcTime: includeContent ? 0 : 300_000,
        select: (skills: Skill[]) =>
          skills.map(skill => ({
            ...skill,
            scopeId: root.scopeId,
            scopeLabel: root.scopeLabel,
            scopeKind: root.scopeKind,
            rootId: root.id,
            rootLabel: root.label,
            provider: root.provider,
          })),
      })),
    [roots, includeContent],
  );
  return useQueries({ queries, combine: combineArchivedSkills });
};
