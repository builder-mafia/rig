import { useQueries } from '@tanstack/react-query';
import { Effect } from 'effect';
import { listSkills } from '../api';
import type { SkillRoot } from '../types';
import { SkillList } from './SkillList';

export const SkillSidebar = ({ roots }: { roots: SkillRoot[] }) => {
  const skillQueries = useQueries({
    queries: roots.map(root => ({
      queryKey: ['skills', root.path],
      queryFn: () => Effect.runPromise(listSkills(root.path)),
    })),
  });

  const skills = skillQueries.flatMap(query => query.data ?? []);
  const isLoading = skillQueries.some(query => query.isLoading);
  const error = skillQueries.find(query => query.error)?.error;

  return (
    <SkillList
      skills={skills}
      selectedSkill={null}
      isLoading={isLoading}
      error={error ? String(error) : null}
      onSelectSkill={() => {}}
    />
  );
};
