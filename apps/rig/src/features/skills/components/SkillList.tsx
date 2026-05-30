import { Badge, cn, ScrollArea } from '@allin/ui';
import type { Skill, SkillUsage, SkillUsageSeries } from '../types';
import { SkillUsageSparkline } from './SkillUsageSparkline';

export interface SkillListProps {
  skills: Skill[];
  selectedSkill: Skill | null;
  skillUsages: SkillUsage[];
  skillUsageTendencies: SkillUsageSeries[];
  isLoading: boolean;
  error: string | null;
  onSelectSkill: (skill: Skill) => void;
}

export const SkillList = ({
  skills,
  selectedSkill,
  skillUsages,
  skillUsageTendencies,
  isLoading,
  error,
  onSelectSkill,
}: SkillListProps) => {
  if (isLoading) {
    return (
      <div className='space-y-2 p-3'>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className='h-16 animate-pulse rounded-lg bg-muted' />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-4 text-sm text-destructive'>
        <p className='font-medium'>Failed to load skills</p>
        <p className='mt-1 text-xs opacity-80'>{error}</p>
      </div>
    );
  }

  const usageByName = new Map(skillUsages.map(usage => [usage.name, usage]));
  const tendencyByName = new Map(
    skillUsageTendencies.map(tendency => [tendency.name, tendency]),
  );
  const totalFires = skills.reduce(
    (total, skill) => total + (usageByName.get(skill.name)?.count ?? 0),
    0,
  );
  const sortedSkills = skills.toSorted((a, b) => {
    const aCount = usageByName.get(a.name)?.count ?? 0;
    const bCount = usageByName.get(b.name)?.count ?? 0;

    return bCount - aCount || a.name.localeCompare(b.name);
  });

  return (
    <div className='flex h-full min-h-0 flex-col'>
      <div className='shrink-0 border-b px-5 py-4'>
        <div className='flex items-baseline gap-2'>
          <h2 className='text-xl font-semibold tracking-tight'>Skills</h2>
          <p className='text-sm text-muted-foreground'>
            {skills.length} skills · {totalFires} fires
          </p>
        </div>
      </div>
      <ScrollArea className='min-h-0 flex-1'>
        <div className='space-y-1'>
          {sortedSkills.length === 0 && (
            <div className='p-1 text-sm text-muted-foreground'>
              No skills found in this root.
            </div>
          )}

          {sortedSkills.map(skill => {
            const isSelected = selectedSkill?.id === skill.id;
            const usage = usageByName.get(skill.name);
            const tendency = tendencyByName.get(skill.name);
            const count = usage?.count ?? 0;

            return (
              <button
                key={skill.id}
                type='button'
                aria-current={isSelected ? 'true' : undefined}
                onClick={() => onSelectSkill(skill)}
                className={cn(
                  'flex w-full min-w-0 items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isSelected
                    ? 'border-primary bg-accent text-accent-foreground'
                    : 'border-transparent bg-transparent',
                )}
              >
                <SkillUsageSparkline values={tendency?.series ?? []} />

                <span className='min-w-0 flex-1'>
                  <span className='flex min-w-0 items-center gap-2'>
                    <span className='truncate text-sm font-medium'>
                      {skill.name}
                    </span>
                    {!skill.isValid && (
                      <Badge
                        variant='destructive'
                        className='h-5 px-1.5 text-[10px]'
                      >
                        Invalid
                      </Badge>
                    )}
                  </span>

                  <span className='mt-1 line-clamp-1 text-xs text-muted-foreground'>
                    {skill.description || skill.relativePath}
                  </span>
                </span>

                <span
                  className={cn(
                    'shrink-0 text-xs font-light tabular-nums',
                    isSelected
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground',
                  )}
                >
                  {count}
                  <span className='text-xs text-muted-foreground'>×</span>
                </span>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
