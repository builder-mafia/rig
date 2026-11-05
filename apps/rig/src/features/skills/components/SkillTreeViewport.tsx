import {
  memo,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from 'react';
import { ScrollArea } from '@allin/ui';
import { getSkillFilePath } from '../insights';
import type { SkillTreeRow } from '../skillTree';
import { getHidingFolder } from '../useHiddenSkills';
import { FolderRow, SkillRow } from './SkillTreeRow';

type Props = {
  rows: SkillTreeRow[];
  selectedIds: ReadonlySet<string>;
  removingIds: ReadonlySet<string>;
  hiddenFolderPaths: ReadonlySet<string>;
  showingHidden: boolean;
  resetKey: string;
  onSkillClick: (event: MouseEvent<HTMLButtonElement>, id: string) => void;
  onSkillContextMenu: (id: string) => void;
  onToggleFolder: (id: string) => void;
  onFolderContextMenu: (id: string) => void;
  onFolderVisibilityChange: (path: string, hidden: boolean) => void;
};

const lowerBound = (offsets: number[], value: number) => {
  let low = 0,
    high = offsets.length - 1;
  while (low < high) {
    const middle = (low + high + 1) >>> 1;
    if (offsets[middle] <= value) low = middle;
    else high = middle - 1;
  }
  return low;
};

// Scroll updates stay in this viewport. Only the visible rows plus overscan mount.
export const SkillTreeViewport = memo(function SkillTreeViewport(props: Props) {
  const { rows, selectedIds, removingIds, resetKey } = props;
  const viewport = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState({ top: 0, height: 600, resetKey });
  const [focus, setFocus] = useState<{
    index: number;
    resetKey: string;
  } | null>(null);
  const focusIndex = focus?.resetKey === resetKey ? focus.index : null;
  const offsets = useMemo(() => {
    const values = [0];
    for (const row of rows)
      values.push(values[values.length - 1] + (row.kind === 'skill' ? 52 : 32));
    return values;
  }, [rows]);
  const total = offsets[offsets.length - 1];
  useLayoutEffect(() => {
    if (viewport.current) viewport.current.scrollTop = 0;
  }, [resetKey]);
  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const update = () =>
      setScroll(previous => {
        const top = element.scrollTop;
        const height = element.clientHeight || 600;
        return previous.top === top &&
          previous.height === height &&
          previous.resetKey === resetKey
          ? previous
          : { top, height, resetKey };
      });
    update();
    element.addEventListener('scroll', update, { passive: true });
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(element);
    return () => {
      element.removeEventListener('scroll', update);
      observer?.disconnect();
    };
  }, [resetKey]);
  const virtual = rows.length > 100;
  const top =
    scroll.resetKey === resetKey
      ? Math.min(scroll.top, Math.max(0, total - scroll.height))
      : 0;
  const start = virtual ? Math.max(0, lowerBound(offsets, top) - 8) : 0;
  const end = virtual
    ? Math.min(rows.length, lowerBound(offsets, top + scroll.height) + 9)
    : rows.length;
  useLayoutEffect(() => {
    if (focusIndex !== null) {
      viewport.current
        ?.querySelector<HTMLButtonElement>(
          `[data-row-index="${focusIndex}"] [data-row-focus]`,
        )
        ?.focus({ preventScroll: true });
    }
  }, [focusIndex, start, end]);
  const removingSelection = useMemo(() => {
    for (const id of selectedIds) if (removingIds.has(id)) return true;
    return false;
  }, [selectedIds, removingIds]);
  return (
    <ScrollArea
      ref={viewport}
      className='min-h-0 min-w-0 flex-1 [&_[data-radix-scroll-area-viewport]>div]:!block'
    >
      <div
        className='min-w-0 px-2 py-2'
        onKeyDown={event => {
          if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key))
            return;
          const row = (event.target as HTMLElement).closest<HTMLElement>(
            '[data-row-index]',
          );
          if (!row) return;
          const current = Number(row.dataset.rowIndex);
          const next =
            event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? rows.length - 1
                : Math.max(
                    0,
                    Math.min(
                      rows.length - 1,
                      current + (event.key === 'ArrowDown' ? 1 : -1),
                    ),
                  );
          event.preventDefault();
          const element = viewport.current;
          if (element) {
            const nextTop = offsets[next];
            const nextBottom = offsets[next + 1];
            if (nextTop < element.scrollTop) element.scrollTop = nextTop;
            else if (nextBottom > element.scrollTop + scroll.height)
              element.scrollTop = nextBottom - scroll.height;
            setScroll(previous => ({ ...previous, top: element.scrollTop }));
          }
          setFocus({ index: next, resetKey });
        }}
      >
        <div
          style={{
            paddingTop: offsets[start],
            paddingBottom: total - offsets[end],
          }}
        >
          {rows.slice(start, end).map((row, index) => (
            <div
              key={`${row.kind}:${row.id}`}
              data-row-index={start + index}
              style={{
                height: row.kind === 'skill' ? 52 : 32,
                paddingLeft: Math.min(row.depth, 4) * 12,
              }}
            >
              {row.kind === 'folder' ? (
                <FolderRow
                  id={row.id}
                  label={row.folder.label}
                  path={row.folder.path}
                  count={row.folder.count}
                  depth={row.depth}
                  expanded={row.expanded}
                  actionPath={
                    props.showingHidden
                      ? getHidingFolder(
                          row.folder.path,
                          props.hiddenFolderPaths,
                        )
                      : row.folder.path || undefined
                  }
                  showingHidden={props.showingHidden}
                  onToggle={props.onToggleFolder}
                  onContextMenu={props.onFolderContextMenu}
                  onVisibilityChange={props.onFolderVisibilityChange}
                />
              ) : (
                <SkillRow
                  id={row.id}
                  name={row.skill.name}
                  description={
                    row.skill.description ||
                    row.skill.relativePath ||
                    'SKILL.md'
                  }
                  path={getSkillFilePath(row.skill)}
                  isValid={row.skill.isValid}
                  isArchived={row.skill.isArchived}
                  selected={selectedIds.has(row.id)}
                  disabled={
                    removingIds.has(row.id) ||
                    (selectedIds.has(row.id) && removingSelection)
                  }
                  onClick={props.onSkillClick}
                  onContextMenu={props.onSkillContextMenu}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
});
