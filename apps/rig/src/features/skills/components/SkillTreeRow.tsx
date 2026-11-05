import { memo, type MouseEvent } from 'react';
import { cn } from '@allin/ui';
import { ChevronRight, Eye, EyeOff, Folder } from 'lucide-react';
import { useI18n } from '@/lib/preferences';

// Rows receive display fields and booleans, never library-wide sets or drafts.
export const SkillRow = memo(function SkillRow({
  id,
  name,
  description,
  path,
  isValid,
  isArchived,
  selected,
  disabled,
  onClick,
  onContextMenu,
}: {
  id: string;
  name: string;
  description: string;
  path: string;
  isValid: boolean;
  isArchived: boolean;
  selected: boolean;
  disabled: boolean;
  onClick: (event: MouseEvent<HTMLButtonElement>, id: string) => void;
  onContextMenu: (id: string) => void;
}) {
  const { t } = useI18n();
  return (
    <button
      type='button'
      data-row-focus
      data-skill-context={id}
      aria-pressed={selected}
      title={path}
      disabled={disabled}
      onClick={event => onClick(event, id)}
      onContextMenu={() => onContextMenu(id)}
      className={cn(
        'group flex h-[52px] w-full min-w-0 select-none items-center rounded-md px-2.5 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:opacity-50',
        selected
          ? 'bg-foreground/[0.07] text-foreground'
          : 'hover:bg-foreground/[0.035]',
      )}
    >
      <span className='min-w-0 flex-1'>
        <span className='flex items-center gap-2'>
          <span className='truncate text-[13px] font-medium leading-5'>
            {name}
          </span>
          {!isValid ? (
            <span className='shrink-0 text-[10px] text-destructive'>
              {t('Invalid')}
            </span>
          ) : null}
          {isArchived ? (
            <span className='shrink-0 text-[10px] text-muted-foreground'>
              {t('Archived file')}
            </span>
          ) : null}
        </span>
        <span className='block truncate text-xs leading-4 text-muted-foreground'>
          {description}
        </span>
      </span>
    </button>
  );
});

export const FolderRow = memo(function FolderRow({
  id,
  label,
  path,
  count,
  depth,
  expanded,
  actionPath,
  showingHidden,
  onToggle,
  onContextMenu,
  onVisibilityChange,
}: {
  id: string;
  label: string;
  path: string;
  count: number;
  depth: number;
  expanded: boolean;
  actionPath?: string;
  showingHidden: boolean;
  onToggle: (id: string) => void;
  onContextMenu: (id: string) => void;
  onVisibilityChange: (path: string, hidden: boolean) => void;
}) {
  const { t } = useI18n();
  const actionTitle =
    showingHidden && actionPath !== path
      ? t('Show parent folder')
      : showingHidden
        ? t('Show')
        : t('Hide');
  return (
    <div
      data-folder-context={path ? id : undefined}
      onContextMenu={() => {
        if (path) onContextMenu(id);
      }}
      className='group/folder flex h-8 min-w-0 items-center rounded-md hover:bg-foreground/[0.035]'
    >
      <button
        type='button'
        data-row-focus
        aria-expanded={expanded}
        onClick={() => onToggle(id)}
        title={path || t('Global skills')}
        className={cn(
          'flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-md px-2 text-left text-xs outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
          depth === 0 ? 'font-medium text-foreground' : 'text-muted-foreground',
        )}
      >
        <ChevronRight
          size={13}
          aria-hidden
          className={cn('shrink-0', expanded && 'rotate-90')}
        />
        {depth === 0 ? (
          <Folder
            size={13}
            aria-hidden
            className='shrink-0 text-muted-foreground'
          />
        ) : null}
        <span className='truncate'>
          {id === 'global' ? t('Global') : label}
        </span>
        <span className='ml-auto pl-2 text-[11px] font-normal tabular-nums text-muted-foreground'>
          {count}
        </span>
      </button>
      {actionPath ? (
        <button
          type='button'
          aria-label={`${actionTitle}: ${actionPath}`}
          title={`${actionTitle}: ${actionPath}`}
          onClick={() => onVisibilityChange(actionPath, !showingHidden)}
          className='mr-1 flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [@media(hover:hover)]:opacity-0 group-hover/folder:opacity-100 focus-visible:opacity-100'
        >
          {showingHidden ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>
      ) : null}
    </div>
  );
});
