import { useDeferredValue, useState } from 'react';
import { useStableEvent } from '@/lib/useStableEvent';
import type { Skill } from '../types';
import { SkillListToolbar } from './SkillListToolbar';
import { SkillTreeView } from './SkillTreeView';

export interface SkillListProps {
  skills: Skill[];
  allSkills?: Skill[];
  hiddenSkills: Skill[];
  hiddenFolderPaths: ReadonlySet<string>;
  onFolderVisibilityChange: (path: string, hidden: boolean) => void;
  selectedSkillIds: ReadonlySet<string>;
  isLoading: boolean;
  error: string | null;
  onSelectionChange: (skills: Skill[], focusedSkill: Skill | null) => void;
  onClearSelection: () => void;
  onRemoveSkills: (skills: Skill[], preserveFolderPath?: string) => void;
  removingSkillIds: ReadonlySet<string>;
  onHideSkills: (skills: Skill[]) => void;
  onShowSkills: (skills: Skill[]) => void;
  showingHidden: boolean;
  onShowingHiddenChange: (hidden: boolean) => void;
}

export const SkillList = (props: SkillListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const query = useDeferredValue(searchQuery.trim().toLowerCase());
  const onSearchChange = useStableEvent((value: string) => {
    setSearchQuery(value);
    props.onClearSelection();
  });
  const onToggleHidden = useStableEvent(() => {
    props.onShowingHiddenChange(!props.showingHidden);
    props.onClearSelection();
  });
  return (
    <div className='flex h-full min-h-0 flex-col'>
      <SkillListToolbar
        showingHidden={props.showingHidden}
        hiddenCount={props.hiddenSkills.length}
        searchQuery={searchQuery}
        error={props.error}
        onSearchChange={onSearchChange}
        onToggleHidden={onToggleHidden}
      />
      <SkillTreeView {...props} query={query} />
    </div>
  );
};
