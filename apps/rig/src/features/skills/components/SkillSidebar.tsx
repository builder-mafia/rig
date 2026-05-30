import { useQueries, useQuery } from '@tanstack/react-query';
import { Effect } from 'effect';
import { listSkills, listSkillUsages, listSkillUsagesTendency } from '../api';
import type { Skill, SkillRoot } from '../types';
import { SkillList } from './SkillList';

interface SkillSidebarProps {
  roots: SkillRoot[];
  selectedSkill: Skill | null;
  onSelectSkill: (skill: Skill) => void;
}

export const SkillSidebar = ({
  roots,
  selectedSkill,
  onSelectSkill,
}: SkillSidebarProps) => {
  const skillQueries = useQueries({
    queries: roots.map(root => ({
      queryKey: ['skills', root.path],
      queryFn: () => Effect.runPromise(listSkills(root.path)),
    })),
  });

  const { data: skillUsages = [] } = useQuery({
    queryKey: ['skill-usages', 'month'],
    queryFn: () => Effect.runPromise(listSkillUsages('month')),
  });

  const { data: skillUsageTendencies = [] } = useQuery({
    queryKey: ['skill-usages-tendency', 'month', 'day'],
    queryFn: () => Effect.runPromise(listSkillUsagesTendency('month', 'day')),
  });

  const skills = skillQueries.flatMap(query => query.data ?? []);
  const isLoading = skillQueries.some(query => query.isLoading);
  const error = skillQueries.find(query => query.error)?.error;

  return (
    <SkillList
      skills={skills}
      selectedSkill={selectedSkill}
      skillUsages={skillUsages}
      skillUsageTendencies={skillUsageTendencies}
      isLoading={isLoading}
      error={error ? String(error) : null}
      onSelectSkill={onSelectSkill}
    />
  );
};
