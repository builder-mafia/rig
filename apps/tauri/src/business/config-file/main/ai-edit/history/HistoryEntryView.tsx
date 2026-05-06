import {
  Bot,
  Clock,
  ExternalLink,
  Pencil,
  Save,
} from 'lucide-react';
import type { AIEditVersionEntry, AIEditVersionSource } from '../types';

const ICON: Record<
  AIEditVersionSource,
  React.ComponentType<{ className?: string }>
> = {
  manual: Save,
  auto: Clock,
  ai: Bot,
  external: ExternalLink,
  editing: Pencil,
};

const TINT: Record<AIEditVersionSource, string> = {
  manual: 'text-foreground',
  auto: 'text-muted-foreground',
  ai: 'text-blue-600',
  external: 'text-amber-600',
  editing: 'text-emerald-600',
};

type HistoryEntryViewProps = {
  entry: AIEditVersionEntry;
  selected: boolean;
  onSelect: () => void;
};

export const HistoryEntryView = ({
  entry,
  selected,
  onSelect,
}: HistoryEntryViewProps) => {
  const Icon = ICON[entry.source];

  return (
    <li>
      <button
        type='button'
        onClick={onSelect}
        className={`flex w-full items-start gap-2.5 border-b px-3 py-2.5 text-left transition-colors hover:bg-secondary ${selected ? 'bg-secondary' : ''}`}
      >
        <span
          className={`mt-0.5 flex size-[22px] shrink-0 items-center justify-center rounded-md bg-muted ${TINT[entry.source]}`}
        >
          <Icon className='size-3.5' />
        </span>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2'>
            <span className='truncate text-sm font-medium'>{entry.label}</span>
            {entry.current ? (
              <span className='shrink-0 rounded-sm bg-emerald-100 px-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700'>
                current
              </span>
            ) : null}
          </div>
          {entry.detail ? (
            <div className='truncate text-xs text-muted-foreground'>
              {entry.detail}
            </div>
          ) : null}
          <div className='mt-0.5 font-mono text-[10px] text-muted-foreground'>
            {entry.when}
          </div>
        </div>
      </button>
    </li>
  );
};
