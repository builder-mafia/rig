import { useI18n } from '@/lib/preferences';
import { toast } from '@allin/ui';
import { useMemo, useState } from 'react';
import { ContentLayout } from '@/layouts/ContentLayout';
import { SidebarLayout } from '@/layouts/SidebarLayout';
import { isSkillSourceVisible, type SkillSourceId } from '../skillSources';
import type { Skill, SkillRoot as SkillRootModel } from '../types';
import { useFetchArchivedSkills } from '../useFetchArchivedSkills';
import { useFetchSkills } from '../useFetchSkills';
import { abbreviateHomePath } from '../skillTree';
import {
  getHiddenSkillKey,
  getHidingFolder,
  useHiddenSkills,
} from '../useHiddenSkills';
import { getSkillIdentity, useRemoveSkill } from '../useRemoveSkill';
import { useRestoreArchivedSkill } from '../useSkillArchive';
import { SkillContentViewer } from './SkillContentViewer';
import { SkillList } from './SkillList';
import {
  useSkillClipboard,
  useSkillDropTarget,
  useSkillTransfer,
} from '../SkillTransferContext';

interface SkillRootProps {
  roots: SkillRootModel[];
  hiddenSkillSourceIds: ReadonlySet<SkillSourceId>;
}

export const SkillRoot = ({ roots, hiddenSkillSourceIds }: SkillRootProps) => {
  const { t } = useI18n();
  const transfer = useSkillTransfer();
  const { isDragOver, dropHandlers } = useSkillDropTarget(
    transfer?.target ?? null,
  );

  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [showingHidden, setShowingHidden] = useState(false);
  const { hiddenPaths, hiddenFolderPaths, setSkillsHidden, setFolderHidden } =
    useHiddenSkills();
  const { skills, isLoading, error } = useFetchSkills(roots);
  const { archivedSkills, error: archiveError } = useFetchArchivedSkills(roots);
  const sourceSkills = useMemo(
    () =>
      skills.filter(skill => isSkillSourceVisible(skill, hiddenSkillSourceIds)),
    [skills, hiddenSkillSourceIds],
  );
  const visibleSkills = useMemo(
    () =>
      sourceSkills.filter(skill => {
        const path = getHiddenSkillKey(skill);
        return (
          !hiddenPaths.has(path) && !getHidingFolder(path, hiddenFolderPaths)
        );
      }),
    [sourceSkills, hiddenPaths, hiddenFolderPaths],
  );
  const hiddenSkills = useMemo(
    () => [
      ...sourceSkills.filter(skill => {
        const path = getHiddenSkillKey(skill);
        return (
          hiddenPaths.has(path) || getHidingFolder(path, hiddenFolderPaths)
        );
      }),
      ...archivedSkills.filter(skill =>
        isSkillSourceVisible(skill, hiddenSkillSourceIds),
      ),
    ],
    [
      sourceSkills,
      hiddenPaths,
      hiddenFolderPaths,
      archivedSkills,
      hiddenSkillSourceIds,
    ],
  );
  const currentSkills = showingHidden ? hiddenSkills : visibleSkills;
  const selectedSkill =
    currentSkills.find(skill => getSkillIdentity(skill) === selectedSkillId) ??
    null;
  const selectedIdSet = useMemo(
    () => new Set(selectedSkillIds),
    [selectedSkillIds],
  );
  useSkillClipboard(
    currentSkills.filter(skill => selectedIdSet.has(getSkillIdentity(skill))),
  );
  const clearSelection = () => {
    setSelectedSkillId(null);
    setSelectedSkillIds([]);
  };
  const { removeSkills, removingSkillIds } = useRemoveSkill({
    onRemoved: clearSelection,
  });
  const { restoreSkill, isRestoring } = useRestoreArchivedSkill({
    onRestored: clearSelection,
  });
  const changeVisibility = (changedSkills: Skill[], hidden: boolean) => {
    if (!setSkillsHidden(changedSkills, hidden)) return;
    clearSelection();
    toast.success(
      t(hidden ? '{name} hidden from Rig' : '{name} shown in Rig', {
        name:
          changedSkills.length === 1
            ? changedSkills[0].name
            : t('{count} skills', { count: changedSkills.length }),
      }),
      {
        description: t('Skill files and agent access are unchanged.'),
        action: {
          label: t('Undo'),
          onClick: () => {
            setSkillsHidden(changedSkills, !hidden);
          },
        },
      },
    );
  };
  const changeFolderVisibility = (path: string, hidden: boolean) => {
    if (!setFolderHidden(path, hidden)) return;
    clearSelection();
    toast.success(
      t(hidden ? 'Folder hidden from Rig' : 'Folder shown in Rig'),
      {
        description: hidden
          ? t('{path} and its subfolders are hidden only in Rig.', {
              path: abbreviateHomePath(path),
            })
          : t(
              '{path} is visible. Individually hidden skills and folders stay hidden.',
              { path: abbreviateHomePath(path) },
            ),
        action: {
          label: t('Undo'),
          onClick: () => setFolderHidden(path, !hidden),
        },
      },
    );
  };

  return (
    <div
      {...dropHandlers}
      className={`flex min-h-0 flex-1 ${isDragOver ? 'ring-1 ring-inset ring-ring' : ''}`}
    >
      <SidebarLayout className={selectedSkill ? 'max-md:hidden' : undefined}>
        <SkillList
          skills={visibleSkills}
          hiddenSkills={hiddenSkills}
          hiddenFolderPaths={hiddenFolderPaths}
          onFolderVisibilityChange={changeFolderVisibility}
          selectedSkillIds={selectedIdSet}
          isLoading={isLoading}
          error={error || archiveError ? String(error ?? archiveError) : null}
          onSelectionChange={(selection, focused) => {
            setSelectedSkillIds(selection.map(getSkillIdentity));
            setSelectedSkillId(focused ? getSkillIdentity(focused) : null);
          }}
          onClearSelection={clearSelection}
          onRemoveSkills={removeSkills}
          removingSkillIds={removingSkillIds}
          onHideSkills={skills => changeVisibility(skills, true)}
          onShowSkills={skills => changeVisibility(skills, false)}
          showingHidden={showingHidden}
          onShowingHiddenChange={setShowingHidden}
        />
      </SidebarLayout>
      <ContentLayout className={!selectedSkill ? 'max-md:hidden' : undefined}>
        <SkillContentViewer
          skill={selectedSkill}
          onBack={clearSelection}
          isHidden={showingHidden}
          hiddenFolderPath={
            selectedSkill && !selectedSkill.isArchived
              ? getHidingFolder(
                  getHiddenSkillKey(selectedSkill),
                  hiddenFolderPaths,
                )
              : undefined
          }
          onShowFolder={path => changeFolderVisibility(path, false)}
          onHideSkill={skill => changeVisibility([skill], true)}
          onShowSkill={skill => changeVisibility([skill], false)}
          onRestoreArchivedSkill={restoreSkill}
          isRestoring={isRestoring}
        />
      </ContentLayout>
    </div>
  );
};
