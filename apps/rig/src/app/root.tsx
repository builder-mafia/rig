import { useI18n } from '@/lib/preferences';
import { Button, toast } from '@allin/ui';
import { Settings } from 'lucide-react';
import { useState } from 'react';
import { SettingsDialog } from '@/features/plugins/components/SettingsDialog';
import {
  GLOBAL_REPOSITORY_ID,
  getImportedRepositoryId,
  RepositorySelector,
} from '@/features/skills/components/RepositorySelector';
import { SkillRoot } from '@/features/skills/components/SkillRoot';
import { useSkillSourceVisibility } from '@/features/skills/skillSources';
import type { SkillRoot as SkillRootModel } from '@/features/skills/types';
import { useImportSkillRoot } from '@/features/skills/useImportSkillRoot';
import { useRemoveSkillRoot } from '@/features/skills/useRemoveSkillRoot';
import { useSkillRepositorySelection } from '@/features/skills/useSkillRepositorySelection';
import { useSkillRoots } from '@/features/skills/useSkillRoots';
import { HeaderLayout } from '@/layouts/HeaderLayout';
import {
  SkillTransferContext,
  useSkillTransferController,
} from '@/features/skills/SkillTransferContext';

export const Root = () => {
  const { t } = useI18n();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { hiddenSourceIds, setSourceVisible } = useSkillSourceVisibility();

  const { data: roots = [] } = useSkillRoots();
  const repositorySelection = useSkillRepositorySelection({
    roots,
    onRepositoryChange: () => undefined,
  });
  const transfer = useSkillTransferController(
    roots,
    repositorySelection.selectedRepositoryId,
  );
  const importSkillRoot = useImportSkillRoot({
    onImported: importedRoot =>
      repositorySelection.selectRepository(importedRoot.scopeId),
  });
  const removeSkillRoot = useRemoveSkillRoot();
  const removeRepository = async (root: SkillRootModel) => {
    const wasSelected =
      repositorySelection.selectedRepositoryId === root.scopeId;

    try {
      await removeSkillRoot.removeRoot(getImportedRepositoryId(root));
      if (wasSelected) {
        repositorySelection.selectRepository(GLOBAL_REPOSITORY_ID);
      }
      const removalToastId = toast.success(
        t('“{name}” removed from Rig', { name: root.label }),
        {
          description: t('The folder and its files were not deleted.'),
          duration: 10_000,
          action: {
            label: t('Undo'),
            onClick: () => {
              void importSkillRoot
                .importFromPath(root.scopeId, wasSelected)
                .then(() => {
                  toast.dismiss(removalToastId);
                  toast.success(t('“{name}” restored', { name: root.label }));
                })
                .catch(() =>
                  toast.error(
                    t('Couldn’t restore “{name}”', { name: root.label }),
                    {
                      description: t(
                        'Add the repository again with the + button.',
                      ),
                    },
                  ),
                );
            },
          },
        },
      );
      return true;
    } catch {
      toast.error(
        t('Couldn’t remove “{name}” from Rig', { name: root.label }),
        {
          description: t('Nothing changed. Try again.'),
        },
      );
      return false;
    }
  };
  return (
    <SkillTransferContext.Provider value={transfer}>
      <main className='rig-shell flex h-dvh flex-col overflow-hidden bg-background text-foreground'>
        <HeaderLayout>
          <div className='flex w-full items-center gap-2 px-3 sm:px-4'>
            <RepositorySelector
              roots={roots}
              selectedRepositoryId={repositorySelection.selectedRepositoryId}
              isImporting={importSkillRoot.isImporting}
              onSelectRepository={id => {
                transfer.clearFolder();
                repositorySelection.selectRepository(id);
              }}
              onImportRepository={importSkillRoot.importFromFolder}
              onRemoveRepository={removeRepository}
              removingRepositoryId={removeSkillRoot.removingRootId}
            />
            <Button
              type='button'
              variant='ghost'
              size='icon'
              aria-label={t('Open settings')}
              onClick={() => setIsSettingsOpen(true)}
              className='ml-auto size-8 rounded-md text-muted-foreground'
            >
              <Settings size={16} />
            </Button>
          </div>
        </HeaderLayout>
        <SkillRoot
          key={repositorySelection.selectedRepositoryId}
          roots={repositorySelection.visibleRoots}
          hiddenSkillSourceIds={hiddenSourceIds}
        />
        <SettingsDialog
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          hiddenSkillSourceIds={hiddenSourceIds}
          onSkillSourceVisibilityChange={setSourceVisible}
        />
      </main>
    </SkillTransferContext.Provider>
  );
};
