import { memo, useMemo, useState, type MouseEvent } from 'react';
import { ContextMenu, ContextMenuTrigger, toast } from '@allin/ui';
import { useI18n } from '@/lib/preferences';
import { useStableEvent } from '@/lib/useStableEvent';
import { matchesSkillSearch } from '../insights';
import { getNextSkillSelection } from '../selection';
import {
  buildSkillTree,
  filterSkillTree,
  flattenSkillTree,
  type SkillFolder,
} from '../skillTree';
import { getSkillIdentity } from '../skillIdentity';
import { getSkillsInFolder } from '../skillRemoval';
import type { Skill } from '../types';
import { CopySkillsDialog } from './CopySkillsDialog';
import {
  DeleteSkillsDialog,
  type SkillRemovalRequest,
} from './DeleteSkillsDialog';
import {
  buildInstallPrompt,
  buildMultiInstallPrompt,
} from './ShareSkillDialog';
import type { SkillListProps } from './SkillList';
import { SkillTreeContextMenu } from './SkillTreeContextMenu';
import { SkillTreeViewport } from './SkillTreeViewport';

const EMPTY_IDS: ReadonlySet<string> = new Set();

// The immediate search input is outside this boundary. Queries, selections and
// expansion each invalidate only the computations and rows that consume them.
export const SkillTreeView = memo(function SkillTreeView(
  props: SkillListProps & { query: string },
) {
  const { t } = useI18n();
  const { skills, hiddenSkills, showingHidden, query, selectedSkillIds } =
    props;
  const [collapsedIds, setCollapsedIds] =
    useState<ReadonlySet<string>>(EMPTY_IDS);
  const [searchCollapsed, setSearchCollapsed] = useState({
    query: '',
    ids: EMPTY_IDS,
  });
  const [anchor, setAnchor] = useState<{ query: string; id: string } | null>(
    null,
  );
  const [target, setTarget] = useState<{
    kind: 'skill' | 'folder';
    id: string;
  } | null>(null);
  const [removal, setRemoval] = useState<SkillRemovalRequest | null>(null);
  const [pendingCopy, setPendingCopy] = useState<Skill[]>([]);
  const sourceSkills = showingHidden ? hiddenSkills : skills;
  const tree = useMemo(() => buildSkillTree(sourceSkills), [sourceSkills]);
  const folders = useMemo(
    () =>
      query
        ? filterSkillTree(tree, skill => matchesSkillSearch(skill, query))
        : tree,
    [tree, query],
  );
  const collapsed = query
    ? searchCollapsed.query === query
      ? searchCollapsed.ids
      : EMPTY_IDS
    : collapsedIds;
  const rows = useMemo(
    () => flattenSkillTree(folders, collapsed),
    [folders, collapsed],
  );
  const visibleSkills = useMemo(
    () => rows.flatMap(row => (row.kind === 'skill' ? [row.skill] : [])),
    [rows],
  );
  const orderedIds = useMemo(
    () => visibleSkills.map(getSkillIdentity),
    [visibleSkills],
  );
  const skillById = useMemo(
    () => new Map(visibleSkills.map(skill => [getSkillIdentity(skill), skill])),
    [visibleSkills],
  );
  const folderById = useMemo(
    () =>
      new Map(
        rows.flatMap(row =>
          row.kind === 'folder' ? [[row.id, row.folder] as const] : [],
        ),
      ),
    [rows],
  );
  const selectedSkills = useMemo(
    () =>
      visibleSkills.filter(skill =>
        selectedSkillIds.has(getSkillIdentity(skill)),
      ),
    [visibleSkills, selectedSkillIds],
  );
  const select = useStableEvent(
    (event: MouseEvent<HTMLButtonElement>, id: string) => {
      const skill = skillById.get(id);
      if (!skill) return;
      const anchorId = anchor?.query === query ? anchor.id : null;
      const nextIds = new Set(
        getNextSkillSelection({
          orderedIds,
          selectedIds: selectedSkillIds,
          clickedId: id,
          anchorId,
          modifiers: {
            toggle: event.metaKey || event.ctrlKey,
            range: event.shiftKey,
          },
        }),
      );
      const next = visibleSkills.filter(candidate =>
        nextIds.has(getSkillIdentity(candidate)),
      );
      if (!event.shiftKey || !anchorId || !skillById.has(anchorId))
        setAnchor({ query, id });
      props.onSelectionChange(
        next,
        nextIds.has(id) ? skill : (next.at(-1) ?? null),
      );
    },
  );
  const contextSkill = useStableEvent((id: string) => {
    const skill = skillById.get(id);
    if (!skill) return;
    setTarget({ kind: 'skill', id });
    if (!selectedSkillIds.has(id)) {
      setAnchor({ query, id });
      props.onSelectionChange([skill], skill);
    }
  });
  const contextFolder = useStableEvent((id: string) =>
    setTarget({ kind: 'folder', id }),
  );
  const toggleFolder = useStableEvent((id: string) => {
    const toggle = (previous: ReadonlySet<string>) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    };
    if (query) setSearchCollapsed({ query, ids: toggle(collapsed) });
    else setCollapsedIds(toggle);
    setAnchor(null);
    props.onClearSelection();
  });
  const changeFolderVisibility = useStableEvent(props.onFolderVisibilityChange);
  const requestFolderRemoval = (folder: SkillFolder) => {
    const candidates = getSkillsInFolder(
      props.allSkills ?? [...skills, ...hiddenSkills],
      folder.path,
    );
    if (candidates.length)
      setRemoval({
        skills: candidates,
        folder: { label: folder.label, path: folder.path },
      });
  };
  const share = async (selected: Skill[]) => {
    try {
      await navigator.clipboard.writeText(
        selected.length === 1
          ? buildInstallPrompt(selected[0])
          : buildMultiInstallPrompt(selected),
      );
      toast.success(t('Copied to clipboard'), { position: 'top-center' });
    } catch {
      toast.error(t('Couldn’t copy the install prompt.'), {
        position: 'top-center',
      });
    }
  };
  const targetSkill =
    target?.kind === 'skill' ? skillById.get(target.id) : undefined;
  const actionSkills = targetSkill
    ? selectedSkillIds.has(getSkillIdentity(targetSkill)) &&
      selectedSkills.length
      ? selectedSkills
      : [targetSkill]
    : [];
  const targetFolder =
    target?.kind === 'folder' ? (folderById.get(target.id) ?? null) : null;
  return (
    <>
      {props.isLoading ? (
        <output className='px-5 py-5 text-xs text-muted-foreground'>
          {t('Loading skills…')}
        </output>
      ) : null}
      {!props.isLoading && !folders.length ? (
        <p className='px-5 py-8 text-center text-xs text-muted-foreground'>
          {query
            ? t('No skills match your search.')
            : showingHidden
              ? t('No hidden skills.')
              : t('No skills found. Add a project to get started.')}
        </p>
      ) : null}
      <ContextMenu
        onOpenChange={open => {
          if (!open) setTarget(null);
        }}
      >
        <ContextMenuTrigger asChild>
          <div
            className='flex min-h-0 min-w-0 flex-1 flex-col'
            onContextMenu={event => {
              if (
                !(event.target as HTMLElement).closest(
                  '[data-skill-context], [data-folder-context]',
                )
              )
                event.preventDefault();
            }}
          >
            <SkillTreeViewport
              rows={rows}
              selectedIds={selectedSkillIds}
              removingIds={props.removingSkillIds}
              hiddenFolderPaths={props.hiddenFolderPaths}
              showingHidden={showingHidden}
              resetKey={`${showingHidden}:${query}`}
              onSkillClick={select}
              onSkillContextMenu={contextSkill}
              onToggleFolder={toggleFolder}
              onFolderContextMenu={contextFolder}
              onFolderVisibilityChange={changeFolderVisibility}
            />
          </div>
        </ContextMenuTrigger>
        <SkillTreeContextMenu
          {...props}
          folder={targetFolder}
          actionSkills={actionSkills}
          deletionDisabled={
            props.isLoading || !!props.error || props.removingSkillIds.size > 0
          }
          onCopy={setPendingCopy}
          onShare={selected => {
            void share(selected);
          }}
          onRemove={setRemoval}
          onRemoveFolder={requestFolderRemoval}
        />
      </ContextMenu>
      {removal ? (
        <DeleteSkillsDialog
          request={removal}
          onConfirm={props.onRemoveSkills}
          onClose={() => setRemoval(null)}
        />
      ) : null}
      {pendingCopy.length ? (
        <CopySkillsDialog
          skills={pendingCopy}
          onClose={() => setPendingCopy([])}
        />
      ) : null}
    </>
  );
});
