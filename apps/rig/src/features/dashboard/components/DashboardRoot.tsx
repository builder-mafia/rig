import { ContentLayout } from '@/layouts/ContentLayout';
import type { SkillRoot } from '@/features/skills/types';
import { SkillUsageDashboard } from './SkillUsageDashboard';

interface DashboardRootProps {
  roots: SkillRoot[];
}

export const DashboardRoot = ({ roots }: DashboardRootProps) => {
  return (
    <div className='flex min-h-0 flex-1'>
      <ContentLayout>
        <SkillUsageDashboard roots={roots} />
      </ContentLayout>
    </div>
  );
};
