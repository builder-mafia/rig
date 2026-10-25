import { toast } from '@allin/ui';
import { useMemo, useState } from 'react';
import { ContentLayout } from '@/layouts/ContentLayout';
import { SidebarLayout } from '@/layouts/SidebarLayout';
import { isSkillSourceVisible, type SkillSourceId } from '../skillSources';
import type { Skill, SkillRoot as SkillRootModel } from '../types';
import { useFetchArchivedSkills } from '../useFetchArchivedSkills';
import { useFetchSkills } from '../useFetchSkills';
import { getHiddenSkillKey, useHiddenSkills } from '../useHiddenSkills';
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
  const { hiddenPaths, setSkillsHidden } = useHiddenSkills();
  const { skills, isLoading, error } = useFetchSkills(roots);
  const { archivedSkills, error: archiveError } = useFetchArchivedSkills(roots);
  const sourceSkills = useMemo(
    () =>
      skills.filter(skill => isSkillSourceVisible(skill, hiddenSkillSourceIds)),
    [skills, hiddenSkillSourceIds],
  );
  const visibleSkills = useMemo(
    () =>
      sourceSkills.filter(skill => !hiddenPaths.has(getHiddenSkillKey(skill))),
    [sourceSkills, hiddenPaths],
  );
  const hiddenSkills = useMemo(
    () => [
      ...sourceSkills.filter(skill =>
        hiddenPaths.has(getHiddenSkillKey(skill)),
      ),
      ...archivedSkills.filter(skill =>
        isSkillSourceVisible(skill, hiddenSkillSourceIds),
      ),
    ],
    [sourceSkills, hiddenPaths, archivedSkills, hiddenSkillSourceIds],
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

  return (
    <div className='flex min-h-0 flex-1'>
      <SidebarLayout className={selectedSkill ? 'max-md:hidden' : undefined}>
        <SkillList
          skills={visibleSkills}
          hiddenSkills={hiddenSkills}
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
          onHideSkill={skill => changeVisibility([skill], true)}
          onShowSkill={skill => changeVisibility([skill], false)}
          onRestoreArchivedSkill={restoreSkill}
          isRestoring={isRestoring}
        />
      </ContentLayout>
    </div>
  );
};
