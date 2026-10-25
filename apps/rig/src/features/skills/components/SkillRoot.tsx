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

interface SkillRootProps {
  roots: SkillRootModel[];
  hiddenSkillSourceIds: ReadonlySet<SkillSourceId>;
}

export const SkillRoot = ({ roots, hiddenSkillSourceIds }: SkillRootProps) => {
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
      `${changedSkills.length === 1 ? changedSkills[0].name : `${changedSkills.length} skills`} ${hidden ? 'hidden from' : 'shown in'} Rig`,
      {
        description: 'Skill files and agent access are unchanged.',
        action: {
          label: 'Undo',
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
    toast.success(`Folder ${hidden ? 'hidden from' : 'shown in'} Rig`, {
      description: hidden
        ? `${abbreviateHomePath(path)} and its subfolders are hidden only in Rig.`
        : `${abbreviateHomePath(path)} is visible. Individually hidden skills and folders stay hidden.`,
      action: {
        label: 'Undo',
        onClick: () => setFolderHidden(path, !hidden),
      },
    });
  };

  return (
    <div className='flex min-h-0 flex-1'>
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
