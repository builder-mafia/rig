import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { open } from '@tauri-apps/plugin-dialog';
import { Effect } from 'effect';
import { useState } from 'react';
import { importSkillRoot, listSkillRoots } from '@/features/skills/api';
import { SkillContentViewer } from '@/features/skills/components/SkillContentViewer';
import { SkillSidebar } from '@/features/skills/components/SkillSidebar';
import {
  GLOBAL_REPOSITORY_ID,
  RepositorySelector,
} from '@/features/skills/components/RepositorySelector';
import type { Skill, SkillRoot } from '@/features/skills/types';
import { ContentLayout } from '@/layouts/ContentLayout';
import { HeaderLayout } from '@/layouts/HeaderLayout';
import { SidebarLayout } from '@/layouts/SidebarLayout';

export const Root = () => {
  const queryClient = useQueryClient();
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [selectedRepositoryId, setSelectedRepositoryId] =
    useState(GLOBAL_REPOSITORY_ID);
  const [isRepositorySelectorOpen, setIsRepositorySelectorOpen] =
    useState(false);

  const { data: rootPaths = [] } = useQuery({
    queryKey: ['skill-roots'],
    queryFn: () => Effect.runPromise(listSkillRoots()),
  });

  const importRootMutation = useMutation({
    mutationFn: (path: string) => Effect.runPromise(importSkillRoot(path)),
    onSuccess: importedRoot => {
      setSelectedRepositoryId(importedRoot.id);
      setSelectedSkill(null);
      setIsRepositorySelectorOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['skill-roots'] });
    },
  });

  const visibleRoots = getVisibleRoots(rootPaths, selectedRepositoryId);

  const handleSelectRepository = (repositoryId: string) => {
    setSelectedRepositoryId(repositoryId);
    setSelectedSkill(null);
    setIsRepositorySelectorOpen(false);
  };

  const handleImportRepository = async () => {
    const selectedPath = await open({ directory: true, multiple: false });

    if (typeof selectedPath !== 'string') {
      return;
    }

    importRootMutation.mutate(selectedPath);
  };

  return (
    <main className='flex h-dvh flex-col overflow-hidden bg-background text-foreground'>
      <HeaderLayout>
        <RepositorySelector
          roots={rootPaths}
          selectedRepositoryId={selectedRepositoryId}
          isOpen={isRepositorySelectorOpen}
          isImporting={importRootMutation.isPending}
          onOpenChange={setIsRepositorySelectorOpen}
          onSelectRepository={handleSelectRepository}
          onImportRepository={handleImportRepository}
        />
      </HeaderLayout>
      <div className='flex min-h-0 flex-1'>
        <SidebarLayout>
          <SkillSidebar
            roots={visibleRoots}
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

const getVisibleRoots = (
  roots: SkillRoot[],
  selectedRepositoryId: string,
) => {
  if (selectedRepositoryId === GLOBAL_REPOSITORY_ID) {
    return roots.filter(root => root.kind === 'default');
  }

  return roots.filter(root => root.id === selectedRepositoryId);
};
