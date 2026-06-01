import { useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Effect } from 'effect';
import { listSkills, listSkillUsages } from '@/features/skills/api';
import type { SkillRoot, WindowType } from '@/features/skills/types';

const dashboardWindows: Array<{
  value: WindowType;
  label: string;
  summaryLabel: string;
  unusedLabel: string;
}> = [
  {
    value: 'week',
    label: '7 days',
    summaryLabel: 'last 7 days',
    unusedLabel: 'Unused in 7 days',
  },
  {
    value: 'month',
    label: '30 days',
    summaryLabel: 'last 30 days',
    unusedLabel: 'Unused in 30 days',
  },
  {
    value: 'threeMonths',
    label: '3 months',
    summaryLabel: 'last 3 months',
    unusedLabel: 'Unused in 3 months',
  },
  {
    value: 'year',
    label: '1 year',
    summaryLabel: 'last 1 year',
    unusedLabel: 'Unused in 1 year',
  },
  {
    value: 'all',
    label: 'All',
    summaryLabel: 'all time',
    unusedLabel: 'Unused overall',
  },
];

interface SkillUsageDashboardProps {
  roots: SkillRoot[];
}

export const SkillUsageDashboard = ({ roots }: SkillUsageDashboardProps) => {
  const [selectedWindow, setSelectedWindow] = useState<WindowType>('month');
  const selectedWindowConfig =
    dashboardWindows.find(window => window.value === selectedWindow) ??
    dashboardWindows[1];
  const repositoryRoot =
    roots.length === 1 && roots[0]?.kind === 'repository' ? roots[0] : null;

  const skillQueries = useQueries({
    queries: roots.map(root => ({
      queryKey: ['skills', root.path],
      queryFn: () => Effect.runPromise(listSkills(root.path)),
    })),
  });

  const { data: skillUsages = [], isLoading: isUsageLoading } = useQuery({
    queryKey: ['skill-usages', selectedWindow],
    queryFn: () => Effect.runPromise(listSkillUsages(selectedWindow)),
  });

  const skills = skillQueries.flatMap(query => query.data ?? []);
  const isSkillsLoading = skillQueries.some(query => query.isLoading);
  const usageByName = new Map(skillUsages.map(usage => [usage.name, usage]));
  const skillNames = new Set(skills.map(skill => skill.name));
  const visibleUsages = skillUsages
    .filter(usage => skillNames.size === 0 || skillNames.has(usage.name))
    .toSorted((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const totalFires = visibleUsages.reduce(
    (total, usage) => total + usage.count,
    0,
  );
  const activeSkills = visibleUsages.filter(usage => usage.count > 0).length;
  const topSkill = visibleUsages[0];
  const maxCount = topSkill?.count ?? 0;
  const unusedSkills = Math.max(skills.length - activeSkills, 0);
  const leastUsedSkills = skills
    .map(skill => ({
      id: skill.id,
      name: skill.name,
      relativePath: skill.relativePath,
      count: usageByName.get(skill.name)?.count ?? 0,
    }))
    .filter(skill => skill.count <= 5)
    .toSorted((a, b) => a.count - b.count || a.name.localeCompare(b.name));
  const isLoading = isSkillsLoading || isUsageLoading;

  return (
    <div className='h-full overflow-auto px-8 py-7'>
      <div className='mx-auto flex max-w-6xl flex-col gap-6'>
        <div>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
            <div>
              <p className='text-sm font-medium text-muted-foreground'>
                {repositoryRoot ? repositoryRoot.label : 'Global'} ·{' '}
                {selectedWindowConfig.summaryLabel}
              </p>
              <h1 className='mt-1 text-3xl font-semibold tracking-tight'>
                Skill Usage Dashboard
              </h1>
            </div>

            <div className='flex flex-col gap-2 sm:items-end'>
              <div className='flex flex-wrap gap-2'>
                {dashboardWindows.map(window => (
                  <DashboardFilterButton
                    key={window.value}
                    label={window.label}
                    isSelected={selectedWindow === window.value}
                    onClick={() => setSelectedWindow(window.value)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className='grid gap-4 md:grid-cols-4'>
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className='h-32 animate-pulse rounded-2xl border bg-muted/40'
              />
            ))}
          </div>
        ) : (
          <>
            <div className='grid gap-4 md:grid-cols-4'>
              <DashboardStat label='Total fires' value={totalFires} />
              <DashboardStat label='Active skills' value={activeSkills} />
              <DashboardStat label='Tracked skills' value={skills.length} />
              <DashboardStat
                label={selectedWindowConfig.unusedLabel}
                value={unusedSkills}
              />
            </div>

            <div className='grid gap-4 lg:grid-cols-[1.2fr_0.8fr]'>
              <section className='rounded-2xl border bg-card p-5'>
                <div className='mb-5 flex items-center justify-between gap-4'>
                  <div>
                    <h2 className='text-lg font-semibold'>Most used skills</h2>
                    <p className='text-sm text-muted-foreground'>
                      Combined usage from the selected repository context.
                    </p>
                  </div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    {visibleUsages.length} used
                  </p>
                </div>

                <div className='space-y-3'>
                  {visibleUsages.length === 0 ? (
                    <p className='rounded-xl border border-dashed p-6 text-sm text-muted-foreground'>
                      No usage events found yet.
                    </p>
                  ) : (
                    visibleUsages.slice(0, 8).map((usage, index) => {
                      const width =
                        maxCount > 0 ? (usage.count / maxCount) * 100 : 0;

                      return (
                        <div key={usage.name} className='space-y-2'>
                          <div className='flex items-center justify-between gap-3 text-sm'>
                            <div className='flex min-w-0 items-center gap-2'>
                              <span className='flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground'>
                                {index + 1}
                              </span>
                              <span className='truncate font-medium'>
                                {usage.name}
                              </span>
                            </div>
                            <span className='font-mono text-xs text-muted-foreground'>
                              {usage.count}×
                            </span>
                          </div>
                          <div className='h-2 overflow-hidden rounded-full bg-muted'>
                            <div
                              className='h-full rounded-full bg-foreground'
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              <section className='rounded-2xl border bg-card p-5'>
                <div className='mb-5'>
                  <div className='flex items-center gap-2'>
                    <span className='size-2 rounded-full bg-amber-400' />
                    <h2 className='text-lg font-semibold'>Least used skills</h2>
                  </div>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    5 fires or fewer. Candidates to review, archive, or remove.
                  </p>
                </div>

                {leastUsedSkills.length === 0 ? (
                  <p className='rounded-xl border border-dashed p-6 text-sm text-muted-foreground'>
                    No skills found in this repository context.
                  </p>
                ) : (
                  <div className='space-y-3'>
                    {leastUsedSkills.slice(0, 8).map(skill => (
                      <div
                        key={skill.id}
                        className='rounded-xl border bg-background p-3'
                      >
                        <div className='flex items-center justify-between gap-3'>
                          <p className='min-w-0 truncate text-sm font-medium'>
                            {skill.name}
                          </p>
                          <span className='shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 font-mono text-xs font-medium text-amber-600 dark:text-amber-300'>
                            {skill.count}×
                          </span>
                        </div>
                        <p className='mt-1 truncate font-mono text-xs text-muted-foreground'>
                          {skill.relativePath}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface DashboardFilterButtonProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

const DashboardFilterButton = ({
  label,
  isSelected,
  onClick,
}: DashboardFilterButtonProps) => {
  return (
    <button
      type='button'
      aria-pressed={isSelected}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        isSelected
          ? 'border-foreground bg-foreground text-background'
          : 'border-border bg-background text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
};

interface DashboardStatProps {
  label: string;
  value: number | string;
}

const DashboardStat = ({ label, value }: DashboardStatProps) => {
  return (
    <div className='rounded-2xl border bg-card p-5'>
      <p className='text-sm font-medium text-muted-foreground'>{label}</p>
      <p className='mt-3 text-3xl font-semibold tracking-tight'>{value}</p>
    </div>
  );
};
