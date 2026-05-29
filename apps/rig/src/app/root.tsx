import { useQuery } from '@tanstack/react-query';
import { Effect } from 'effect';
import { useState } from 'react';
import { listSkillRoots } from '@/features/skills/api';
import { SkillContentViewer } from '@/features/skills/components/SkillContentViewer';
import { SkillSidebar } from '@/features/skills/components/SkillSidebar';
import type { Skill } from '@/features/skills/types';
import { ContentLayout } from '@/layouts/ContentLayout';
import { HeaderLayout } from '@/layouts/HeaderLayout';
import { SidebarLayout } from '@/layouts/SidebarLayout';

export const Root = () => {
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const { data: rootPaths } = useQuery({
    queryKey: ['skill-roots'],
    queryFn: () => Effect.runPromise(listSkillRoots()),
  });

  return (
    <main className='flex h-dvh flex-col overflow-hidden bg-background text-foreground'>
      <HeaderLayout>
        <span>Hello</span>
      </HeaderLayout>
      <div className='flex min-h-0 flex-1'>
        <SidebarLayout>
          <SkillSidebar
            roots={rootPaths ?? []}
            selectedSkill={selectedSkill}
            onSelectSkill={setSelectedSkill}
          />
        </SidebarLayout>

        <ContentLayout>
          <SkillContentViewer skill={selectedSkill} />
        </ContentLayout>
      </div>
    </main>
  );
};
