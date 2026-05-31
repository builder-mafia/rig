import { useState } from 'react';
import { ContentLayout } from '@/layouts/ContentLayout';
import { SidebarLayout } from '@/layouts/SidebarLayout';
import { SkillContentViewer } from './SkillContentViewer';
import { SkillSidebar } from './SkillSidebar';
import type { Skill, SkillRoot as SkillRootModel } from '../types';

interface SkillRootProps {
  roots: SkillRootModel[];
}

export const SkillRoot = ({ roots }: SkillRootProps) => {
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  return (
    <div className='flex min-h-0 flex-1'>
      <SidebarLayout>
        <SkillSidebar
          roots={roots}
          selectedSkill={selectedSkill}
          onSelectSkill={setSelectedSkill}
        />
      </SidebarLayout>

      <ContentLayout>
        <SkillContentViewer skill={selectedSkill} />
      </ContentLayout>
    </div>
  );
};
