import { useI18n } from '@/lib/preferences';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  cn,
  ScrollArea,
  toast,
} from '@allin/ui';
import {
  ArrowLeft,
  ChevronRight,
  Clipboard,
  Eye,
  EyeOff,
  Folder,
  Search,
  Share2,
  Trash2,
} from 'lucide-react';
import {
  type MouseEvent,
  type ReactNode,
  useDeferredValue,
  useId,
  useMemo,
  useState,
} from 'react';
import { getSkillFilePath, matchesSkillSearch } from '../insights';
import { getNextSkillSelection } from '../selection';
import {
  buildSkillTree,
  getExpandedSkills,
  type SkillFolder,
} from '../skillTree';
import type { Skill } from '../types';
import { getHiddenSkillKey, getHidingFolder } from '../useHiddenSkills';
import { getSkillIdentity } from '../useRemoveSkill';
import { ShareSkillsDialog } from './ShareSkillDialog';
import { useSkillDropTarget, useSkillTransfer } from '../SkillTransferContext';
import { createSkillTransfer, writeSkillTransfer } from '../skillTransfer';

export interface SkillListProps {
  skills: Skill[];
  hiddenSkills: Skill[];
  hiddenFolderPaths: ReadonlySet<string>;
  onFolderVisibilityChange: (path: string, hidden: boolean) => void;
  selectedSkillIds: ReadonlySet<string>;
  isLoading: boolean;
  error: string | null;
  onSelectionChange: (skills: Skill[], focusedSkill: Skill | null) => void;
  onClearSelection: () => void;
  onRemoveSkills: (skills: Skill[]) => void;
  removingSkillIds: ReadonlySet<string>;
  onHideSkills: (skills: Skill[]) => void;
  onShowSkills: (skills: Skill[]) => void;
  showingHidden: boolean;
  onShowingHiddenChange: (hidden: boolean) => void;
}

export const SkillList = ({
  skills,
  hiddenSkills,
  hiddenFolderPaths,
  onFolderVisibilityChange,
  selectedSkillIds,
  isLoading,
  error,
  onSelectionChange,
  onClearSelection,
  onRemoveSkills,
  removingSkillIds,
  onHideSkills,
  onShowSkills,
  showingHidden,
  onShowingHiddenChange,
}: SkillListProps) => {
  const { t } = useI18n();
  const transfer = useSkillTransfer();

  const [skillsPendingRemoval, setSkillsPendingRemoval] = useState<Skill[]>([]);
  const [skillsPendingShare, setSkillsPendingShare] = useState<Skill[]>([]);
  const [selectionAnchorId, setSelectionAnchorId] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedIds, setCollapsedIds] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const [searchCollapsed, setSearchCollapsed] = useState<{
    query: string;
    ids: ReadonlySet<string>;
  }>({ query: '', ids: new Set() });
  const query = useDeferredValue(searchQuery.trim().toLowerCase());
  const folders = useMemo(
    () =>
      buildSkillTree(
        (showingHidden ? hiddenSkills : skills).filter(skill =>
          matchesSkillSearch(skill, query),
        ),
      ),
    [hiddenSkills, query, showingHidden, skills],
  );
  const effectiveCollapsedIds = useMemo(
    () =>
      query
        ? searchCollapsed.query === query
          ? searchCollapsed.ids
          : new Set<string>()
        : collapsedIds,
    [query, collapsedIds, searchCollapsed],
  );
  const visibleSkills = useMemo(
    () => getExpandedSkills(folders, effectiveCollapsedIds),
    [folders, effectiveCollapsedIds],
  );
  const selectedVisibleSkills = visibleSkills.filter(skill =>
    selectedSkillIds.has(getSkillIdentity(skill)),
  );

  const handleSkillClick = (
    event: MouseEvent<HTMLButtonElement>,
    skill: Skill,
  ) => {
    const clickedId = getSkillIdentity(skill);
    const orderedIds = visibleSkills.map(getSkillIdentity);
    const nextIds = new Set(
      getNextSkillSelection({
        orderedIds,
        selectedIds: selectedSkillIds,
        clickedId,
        anchorId: selectionAnchorId,
        modifiers: {
          toggle: event.metaKey || event.ctrlKey,
          range: event.shiftKey,
        },
      }),
    );
    const nextSkills = visibleSkills.filter(candidate =>
      nextIds.has(getSkillIdentity(candidate)),
    );
    if (
      !event.shiftKey ||
      !selectionAnchorId ||
      !orderedIds.includes(selectionAnchorId)
    )
      setSelectionAnchorId(clickedId);
    onSelectionChange(
      nextSkills,
      nextIds.has(clickedId) ? skill : (nextSkills.at(-1) ?? null),
    );
  };
  const toggleFolder = (folder: SkillFolder) => {
    if (folder.path) transfer?.selectFolder(folder.path);
    else transfer?.clearFolder();
    const toggle = (current: ReadonlySet<string>) => {
      const next = new Set(current);
      if (next.has(folder.id)) next.delete(folder.id);
      else next.add(folder.id);
      return next;
    };
    if (query)
      setSearchCollapsed({ query, ids: toggle(effectiveCollapsedIds) });
    else setCollapsedIds(toggle);
    setSelectionAnchorId(null);
    onClearSelection();
  };
  const switchView = () => {
    onShowingHiddenChange(!showingHidden);
    setSelectionAnchorId(null);
    onClearSelection();
  };

  const copyInstructions = async (skill: Skill) => {
    try {
      await navigator.clipboard.writeText(skill.content);
      toast.success(t('Instructions copied'));
    } catch {
      toast.error(t('Couldn’t copy skill instructions. Try again.'));
    }
  };

  const renderSkill = (skill: Skill) => {
    const id = getSkillIdentity(skill);
    const isSelected = selectedSkillIds.has(id);
    const hidingFolder = showingHidden
      ? getHidingFolder(getHiddenSkillKey(skill), hiddenFolderPaths)
      : undefined;
    const actionSkills =
      isSelected && selectedVisibleSkills.length
        ? selectedVisibleSkills
        : [skill];
    const isRemoving = actionSkills.some(candidate =>
      removingSkillIds.has(getSkillIdentity(candidate)),
    );
    return (
      <ContextMenu key={id}>
        <ContextMenuTrigger asChild>
          <button
            type='button'
            draggable={!skill.isArchived && !!transfer && !isRemoving}
            onDragStart={event => {
              const payload = createSkillTransfer(actionSkills);
              if (!payload) {
                event.preventDefault();
                toast.error(
                  t(
                    'Select existing skill folders to copy. Restore archived files first.',
                  ),
                );
                return;
              }
              writeSkillTransfer(event.dataTransfer, payload);
              event.dataTransfer.effectAllowed = 'copy';
              if (!isSelected) onSelectionChange([skill], skill);
            }}
            aria-pressed={isSelected}
            title={getSkillFilePath(skill)}
            disabled={isRemoving}
            onClick={event => handleSkillClick(event, skill)}
            onContextMenu={() => {
              if (!isSelected) {
                setSelectionAnchorId(id);
                onSelectionChange([skill], skill);
              }
            }}
            className={cn(
              'group flex w-full min-w-0 select-none items-center rounded-md px-2.5 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:opacity-50',
              isSelected
                ? 'bg-foreground/[0.07] text-foreground'
                : 'hover:bg-foreground/[0.035]',
            )}
          >
            <span className='min-w-0 flex-1'>
              <span className='flex items-center gap-2'>
                <span className='truncate text-[13px] font-medium leading-5'>
                  {skill.name}
                </span>
                {!skill.isValid ? (
                  <span className='shrink-0 text-[10px] text-destructive'>
                    {t('Invalid')}
                  </span>
                ) : null}
                {skill.isArchived ? (
                  <span className='shrink-0 text-[10px] text-muted-foreground'>
                    {t('Archived file')}
                  </span>
                ) : null}
              </span>
              <span className='block truncate text-xs leading-4 text-muted-foreground'>
                {skill.description || skill.relativePath || 'SKILL.md'}
              </span>
            </span>
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent className='w-52'>
          <ContextMenuItem onSelect={() => void copyInstructions(skill)}>
            <Clipboard />
            {t('Copy instructions')}
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => setSkillsPendingShare(actionSkills)}>
            <Share2 />
            {actionSkills.length === 1
              ? t('Share skill')
              : t('Share {count} skills', { count: actionSkills.length })}
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
                {hidingFolder
                  ? t('Show containing folder in Rig')
                  : showingHidden
                    ? t('Show in Rig')
                    : t('Hide from Rig')}
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                disabled={isRemoving}
                variant='destructive'
                onSelect={() => setSkillsPendingRemoval(actionSkills)}
              >
                <Trash2 />
                {actionSkills.length === 1
                  ? t('Delete skill…')
                  : t('Delete {count} skills…', { count: actionSkills.length })}
              </ContextMenuItem>
            </>
          ) : null}
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  return (
    <div className='flex h-full min-h-0 flex-col'>
      <div className='shrink-0 space-y-2 border-b border-border/60 p-3'>
        {showingHidden ? (
          <div className='flex items-center gap-2 px-1 pb-1'>
            <button
              type='button'
              onClick={switchView}
              aria-label={t('Back to skills')}
              className='rounded p-1 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            >
              <ArrowLeft size={14} />
            </button>
            <h1 className='text-sm font-medium'>{t('Hidden')}</h1>
            <span className='ml-auto text-xs tabular-nums text-muted-foreground'>
              {hiddenSkills.length}
            </span>
          </div>
        ) : null}
        <div className='flex items-center gap-2'>
          <label className='relative min-w-0 flex-1'>
            <Search
              size={14}
              aria-hidden='true'
              className='pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground'
            />
            <span className='sr-only'>{t('Search skills')}</span>
            <input
              type='search'
              value={searchQuery}
              onChange={event => {
                setSearchQuery(event.target.value);
                onClearSelection();
                setSelectionAnchorId(null);
              }}
              placeholder={t('Search skills…')}
              className='h-8 w-full rounded-md border border-border/70 bg-background pl-8 pr-2 text-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring'
            />
          </label>
          {!showingHidden ? (
            <button
              type='button'
              onClick={switchView}
              aria-label={t('Hidden skills ({count})', {
                count: hiddenSkills.length,
              })}
              title={t('Hidden skills')}
              className='inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            >
              <EyeOff size={14} />
              <span className='tabular-nums'>{hiddenSkills.length}</span>
            </button>
          ) : null}
        </div>
        {showingHidden ? (
          <p className='px-1 text-xs leading-5 text-muted-foreground'>
            {t(
              'Hidden only in Rig. Previously archived files can also be recovered here.',
            )}
          </p>
        ) : null}
        {error ? (
          <p role='alert' className='px-1 text-xs text-destructive'>
            {t('Some folders couldn’t be read:')}
            {error}
          </p>
        ) : null}
      </div>
      <ScrollArea className='min-h-0 min-w-0 flex-1 [&_[data-radix-scroll-area-viewport]>div]:!block'>
        <div className='min-w-0 px-2 py-2'>
          {isLoading ? (
            <output className='px-3 py-5 text-xs text-muted-foreground'>
              {t('Loading skills…')}
            </output>
          ) : folders.length === 0 ? (
            <p className='px-3 py-8 text-center text-xs text-muted-foreground'>
              {query
                ? t('No skills match your search.')
                : showingHidden
                  ? t('No hidden skills.')
                  : t('No skills found. Add a project to get started.')}
            </p>
          ) : null}
          {folders.map(folder => (
            <FolderGroup
              key={folder.id}
              folder={folder}
              depth={0}
              collapsedIds={effectiveCollapsedIds}
              onToggle={toggleFolder}
              renderSkill={renderSkill}
              showingHidden={showingHidden}
              hiddenFolderPaths={hiddenFolderPaths}
              onFolderVisibilityChange={onFolderVisibilityChange}
            />
          ))}
        </div>
      </ScrollArea>
      <AlertDialog
        open={skillsPendingRemoval.length > 0}
        onOpenChange={open => {
          if (!open) setSkillsPendingRemoval([]);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {skillsPendingRemoval.length === 1
                ? t('Delete “{name}”?', {
                    name: skillsPendingRemoval[0]?.name ?? '',
                  })
                : t('Delete {count} skills?', {
                    count: skillsPendingRemoval.length,
                  })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'This permanently deletes the skill folders from disk. To keep the files, use Hide from Rig instead.',
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onRemoveSkills(skillsPendingRemoval);
                setSkillsPendingRemoval([]);
              }}
            >
              {t('Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ShareSkillsDialog
        skills={skillsPendingShare}
        open={skillsPendingShare.length > 0}
        onOpenChange={open => {
          if (!open) setSkillsPendingShare([]);
        }}
      />
    </div>
  );
};

const FolderGroup = ({
  folder,
  depth,
  collapsedIds,
  onToggle,
  renderSkill,
  showingHidden,
  hiddenFolderPaths,
  onFolderVisibilityChange,
}: {
  folder: SkillFolder;
  depth: number;
  collapsedIds: ReadonlySet<string>;
  onToggle: (folder: SkillFolder) => void;
  renderSkill: (skill: Skill) => ReactNode;
  showingHidden: boolean;
  hiddenFolderPaths: ReadonlySet<string>;
  onFolderVisibilityChange: (path: string, hidden: boolean) => void;
}) => {
  const { t } = useI18n();

  const contentId = useId();
  const expanded = !collapsedIds.has(folder.id);
  const hidingFolder = getHidingFolder(folder.path, hiddenFolderPaths);
  const actionPath = showingHidden ? hidingFolder : folder.path;
  const actionLabel = showingHidden
    ? hidingFolder === folder.path
      ? t('Show folder in Rig')
      : t('Show parent folder in Rig')
    : t('Hide folder from Rig');
  const transfer = useSkillTransfer();
  const target = showingHidden
    ? null
    : (transfer?.folderTarget(folder.path) ?? null);
  const { isDragOver, dropHandlers } = useSkillDropTarget(target);
  const header = (
    <div
      {...dropHandlers}
      data-skill-drop-target={target?.path}
      className={cn(
        'group/folder flex min-w-0 items-center rounded-md hover:bg-foreground/[0.035]',
        isDragOver && 'bg-accent ring-1 ring-inset ring-ring',
        target &&
          transfer?.target?.path === target.path &&
          'bg-foreground/[0.04]',
      )}
    >
      <button
        type='button'
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={() => onToggle(folder)}
        title={folder.path || t('Global skills')}
        className={cn(
          'flex min-h-8 min-w-0 flex-1 items-center gap-1.5 rounded-md px-2 text-left text-xs outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
          depth === 0 ? 'font-medium text-foreground' : 'text-muted-foreground',
        )}
      >
        <ChevronRight
          size={13}
          aria-hidden='true'
          className={cn('shrink-0', expanded && 'rotate-90')}
        />
        {depth === 0 ? (
          <Folder
            size={13}
            aria-hidden='true'
            className='shrink-0 text-muted-foreground'
          />
        ) : null}
        <span className='truncate'>
          {folder.id === 'global' ? t('Global') : folder.label}
        </span>
        <span className='ml-auto pl-2 text-[11px] font-normal tabular-nums text-muted-foreground'>
          {folder.count}
        </span>
      </button>
      {actionPath ? (
        <button
          type='button'
          aria-label={`${actionLabel}: ${actionPath}`}
          title={`${actionLabel}: ${actionPath}`}
          onClick={() => onFolderVisibilityChange(actionPath, !showingHidden)}
          className='mr-1 flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [@media(hover:hover)]:opacity-0 group-hover/folder:opacity-100 focus-visible:opacity-100'
        >
          {showingHidden ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>
      ) : null}
    </div>
  );
  return (
    <section className={depth === 0 ? 'mb-2' : 'min-w-0'}>
      {actionPath ? (
        <ContextMenu>
          <ContextMenuTrigger asChild>{header}</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem
              title={actionPath}
              onSelect={() =>
                onFolderVisibilityChange(actionPath, !showingHidden)
              }
            >
              {showingHidden ? <Eye /> : <EyeOff />}
              {actionLabel}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      ) : (
        header
      )}
      <div
        id={contentId}
        hidden={!expanded}
        className={depth < 4 ? 'ml-3' : undefined}
      >
        {expanded ? (
          <>
            {folder.skills.map(renderSkill)}
            {folder.folders.map(child => (
              <FolderGroup
                key={child.id}
                folder={child}
                depth={depth + 1}
                collapsedIds={collapsedIds}
                onToggle={onToggle}
                renderSkill={renderSkill}
                showingHidden={showingHidden}
                hiddenFolderPaths={hiddenFolderPaths}
                onFolderVisibilityChange={onFolderVisibilityChange}
              />
            ))}
          </>
        ) : null}
      </div>
    </section>
  );
};
