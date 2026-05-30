import { useState } from 'react';
import { SkillContentViewer } from '@/features/skills/components/SkillContentViewer';
import { SkillSidebar } from '@/features/skills/components/SkillSidebar';
import { RepositorySelector } from '@/features/skills/components/RepositorySelector';
import type { Skill } from '@/features/skills/types';
import { useImportSkillRoot } from '@/features/skills/useImportSkillRoot';
import { useSkillRepositorySelection } from '@/features/skills/useSkillRepositorySelection';
import { useSkillRoots } from '@/features/skills/useSkillRoots';
import { ContentLayout } from '@/layouts/ContentLayout';
import { HeaderLayout } from '@/layouts/HeaderLayout';
import { SidebarLayout } from '@/layouts/SidebarLayout';

export const Root = () => {
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const { data: roots = [] } = useSkillRoots();
  const repositorySelection = useSkillRepositorySelection({
    roots,
    onRepositoryChange: () => setSelectedSkill(null),
  });
  const importSkillRoot = useImportSkillRoot({
    onImported: importedRoot =>
      repositorySelection.selectRepository(importedRoot.id),
  });

  return (
    <main className='flex h-dvh flex-col overflow-hidden bg-background text-foreground'>
      <HeaderLayout>
        <RepositorySelector
          roots={roots}
          selectedRepositoryId={repositorySelection.selectedRepositoryId}
          isOpen={repositorySelection.isOpen}
          isImporting={importSkillRoot.isImporting}
          onOpenChange={repositorySelection.setIsOpen}
          onSelectRepository={repositorySelection.selectRepository}
          onImportRepository={importSkillRoot.importFromFolder}
        />
      </HeaderLayout>
      <div className='flex min-h-0 flex-1'>
        <SidebarLayout>
          <SkillSidebar
            roots={repositorySelection.visibleRoots}
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
