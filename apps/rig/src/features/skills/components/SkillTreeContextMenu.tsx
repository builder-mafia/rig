import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@allin/ui';
import { Copy, Eye, EyeOff, Share2, Trash2 } from 'lucide-react';
import { useI18n } from '@/lib/preferences';
import type { Skill } from '../types';
import type { SkillFolder } from '../skillTree';
import { getHiddenSkillKey, getHidingFolder } from '../useHiddenSkills';
import { getUniqueActiveSkills } from '../skillRemoval';
import { getSkillIdentity } from '../skillIdentity';
import type { SkillRemovalRequest } from './DeleteSkillsDialog';
import type { SkillListProps } from './SkillList';

export const SkillTreeContextMenu = ({
  folder,
  actionSkills,
  showingHidden,
  hiddenFolderPaths,
  removingSkillIds,
  onFolderVisibilityChange,
  onShowSkills,
  onHideSkills,
  deletionDisabled,
  onCopy,
  onShare,
  onRemove,
  onRemoveFolder,
}: Pick<
  SkillListProps,
  | 'showingHidden'
  | 'hiddenFolderPaths'
  | 'removingSkillIds'
  | 'onFolderVisibilityChange'
  | 'onShowSkills'
  | 'onHideSkills'
> & {
  folder: SkillFolder | null;
  actionSkills: Skill[];
  deletionDisabled: boolean;
  onCopy: (skills: Skill[]) => void;
  onShare: (skills: Skill[]) => void;
  onRemove: (request: SkillRemovalRequest) => void;
  onRemoveFolder: (folder: SkillFolder) => void;
}) => {
  const { t } = useI18n();
  const hidingFolder =
    actionSkills[0] && showingHidden
      ? getHidingFolder(getHiddenSkillKey(actionSkills[0]), hiddenFolderPaths)
      : undefined;
  const isRemoving = actionSkills.some(skill =>
    removingSkillIds.has(getSkillIdentity(skill)),
  );
  const actionPath = folder
    ? showingHidden
      ? getHidingFolder(folder.path, hiddenFolderPaths)
      : folder.path
    : undefined;
  return (
    <ContextMenuContent className='w-52'>
      {folder ? (
        <>
          {actionPath ? (
            <ContextMenuItem
              title={actionPath}
              onSelect={() =>
                onFolderVisibilityChange(actionPath, !showingHidden)
              }
            >
              {showingHidden ? <Eye /> : <EyeOff />}
              {showingHidden ? t('Show') : t('Hide')}
            </ContextMenuItem>
          ) : null}
          {actionPath ? <ContextMenuSeparator /> : null}
          <ContextMenuItem
            variant='destructive'
            disabled={deletionDisabled}
            onSelect={() => onRemoveFolder(folder)}
          >
            <Trash2 />
            {t('Delete all skills…')}
          </ContextMenuItem>
        </>
      ) : actionSkills.length ? (
        <>
          <ContextMenuItem
            disabled={
              isRemoving || actionSkills.some(candidate => candidate.isArchived)
            }
            onSelect={() => onCopy(actionSkills)}
          >
            <Copy />
            {t('Copy')}
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => onShare(actionSkills)}>
            <Share2 />
            {t('Share')}
          </ContextMenuItem>
          {!actionSkills.some(candidate => candidate.isArchived) ? (
            <>
              <ContextMenuItem
                onSelect={() =>
                  hidingFolder
                    ? onFolderVisibilityChange(hidingFolder, false)
                    : showingHidden
                      ? onShowSkills(
                          actionSkills.filter(
                            candidate =>
                              !getHidingFolder(
                                getHiddenSkillKey(candidate),
                                hiddenFolderPaths,
                              ),
                          ),
                        )
                      : onHideSkills(actionSkills)
                }
                title={hidingFolder}
              >
                {showingHidden ? <Eye /> : <EyeOff />}
                {showingHidden ? t('Show') : t('Hide')}
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                disabled={removingSkillIds.size > 0}
                variant='destructive'
                onSelect={() =>
                  onRemove({ skills: getUniqueActiveSkills(actionSkills) })
                }
              >
                <Trash2 />
                {actionSkills.length === 1
                  ? t('Delete skill…')
                  : t('Delete {count} skills…', { count: actionSkills.length })}
              </ContextMenuItem>
            </>
          ) : null}
        </>
      ) : null}
    </ContextMenuContent>
  );
};
