import { ChevronDown, ChevronRight } from 'lucide-react';
import type {
  ConfigDirectoryEntry,
  StorageConfigFile,
} from '@/lib/gateway/config-file/types';
import { EntryIconView } from '../EntryIconView';
import { EntryItemView } from './EntryItemView';

type Props = {
  rootEntry: StorageConfigFile;
  entry: {
    name: string;
    path: string;
    isDirectory: boolean;
  };
  isSelected: boolean;
  iconUrl: string | null;
  depth: number;
  isExpanded: boolean;
  isLoading: boolean;
  directoryEntries: ConfigDirectoryEntry[];
  onToggle: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onSelect: () => void;
};

export const DirectoryItemView = ({
  rootEntry,
  entry,
  isSelected,
  iconUrl,
  depth,
  isExpanded,
  isLoading,
  directoryEntries,
  onToggle,
  onSelect,
}: Props) => {
  return (
    <div
      className={`relative rounded-md ${
        isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50'
      }`}
    >
      <button
        type='button'
        className='absolute inset-0 rounded-md'
        onClick={onSelect}
        aria-label={`Select ${entry.name}`}
      />
      <div
        className={`flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors ${
          isSelected ? 'bg-accent text-accent-foreground' : ''
        }`}
        style={{ paddingLeft: `${depth === 0 ? 8 : 12 + depth * 16}px` }}
      >
        <button
          type='button'
          className='relative z-10 mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-sm hover:bg-black/5'
          onClick={onToggle}
        >
          {isExpanded ? (
            <ChevronDown className='size-4 text-muted-foreground' />
          ) : (
            <ChevronRight className='size-4 text-muted-foreground' />
          )}
        </button>
        <div className='flex min-w-0 flex-1 items-start gap-2 text-left'>
          <span className='mt-0.5 inline-flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-sm'>
            <EntryIconView isDirectory={entry.isDirectory} iconUrl={iconUrl} />
          </span>
          <span className='min-w-0 flex-1'>
            <span className='block truncate text-sm font-medium'>
              {entry.name}
            </span>
            <span className='block truncate text-xs text-muted-foreground'>
              {entry.path}
            </span>
          </span>
        </div>
      </div>

      {isExpanded && isLoading ? (
        <p className='px-2 py-1 pl-10 text-xs text-muted-foreground'>
          Loading...
        </p>
      ) : null}
      {isExpanded ? (
        <div className='pb-1'>
          {directoryEntries.map(child => (
            <EntryItemView
              key={child.path}
              rootEntry={rootEntry}
              entry={child}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};
