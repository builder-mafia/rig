import { cn, Popover, PopoverContent, PopoverTrigger } from '@allin/ui';
import { Check, ChevronsUpDown, Folder, Home, Plus } from 'lucide-react';
import type { SkillRoot } from '../types';

const GLOBAL_REPOSITORY_ID = 'global';

interface RepositorySelectorProps {
  roots: SkillRoot[];
  selectedRepositoryId: string;
  isOpen: boolean;
  isImporting: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelectRepository: (repositoryId: string) => void;
  onImportRepository: () => void;
}

export const RepositorySelector = ({
  roots,
  selectedRepositoryId,
  isOpen,
  isImporting,
  onOpenChange,
  onSelectRepository,
  onImportRepository,
}: RepositorySelectorProps) => {
  const repositoryRoots = roots.filter(root => root.kind === 'repository');
  const selectedRepository = repositoryRoots.find(
    root => root.id === selectedRepositoryId,
  );
  const selectedLabel = selectedRepository?.label ?? 'Global';

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type='button'
          className='flex h-14 w-78 ml-2 items-center gap-3 rounded-sm px-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        >
          <span className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background'>
            {selectedRepository ? <Folder size={18} /> : <Home size={18} />}
          </span>
          <span className='min-w-0 flex-1'>
            <span className='block truncate text-sm font-semibold leading-4'>
              {selectedLabel}
            </span>
          </span>

          <ChevronsUpDown size={16} className='shrink-0 text-muted-foreground' />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align='start'
        sideOffset={0}
        className='w-78 shadow-2xl rounded-2xl p-3'
      >
        <p className='px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
          Repository
        </p>

        <RepositoryOption
          icon={<Home size={18} />}
          label='Global'
          path='Default skill roots'
          isSelected={selectedRepositoryId === GLOBAL_REPOSITORY_ID}
          onClick={() => onSelectRepository(GLOBAL_REPOSITORY_ID)}
        />

        {repositoryRoots.map(root => (
          <RepositoryOption
            key={root.id}
            icon={<Folder size={18} />}
            label={root.label}
            path={root.path}
            isSelected={selectedRepositoryId === root.id}
            onClick={() => onSelectRepository(root.id)}
          />
        ))}

        <div className='my-3 border-t' />

        <button
          type='button'
          onClick={onImportRepository}
          disabled={isImporting}
          className='flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        >
          <span className='flex size-9 shrink-0 items-center justify-center rounded-lg border border-dashed bg-background text-muted-foreground'>
            <Plus size={18} />
          </span>

          <span className='min-w-0'>
            <span className='block text-sm font-semibold'>
              {isImporting ? 'Importing repository...' : 'Import repository...'}
            </span>
            <span className='mt-0.5 block font-mono text-xs text-muted-foreground'>
              From a local folder
            </span>
          </span>
        </button>
      </PopoverContent>
    </Popover>
  );
};

interface RepositoryOptionProps {
  icon: React.ReactNode;
  label: string;
  path: string;
  isSelected: boolean;
  onClick: () => void;
}

const RepositoryOption = ({
  icon,
  label,
  path,
  isSelected,
  onClick,
}: RepositoryOptionProps) => {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isSelected ? 'bg-muted' : 'hover:bg-muted/70',
      )}
    >
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg',
          isSelected
            ? 'bg-foreground text-background'
            : 'border bg-background text-foreground',
        )}
      >
        {icon}
      </span>

      <span className='min-w-0 flex-1'>
        <span className='block truncate text-sm font-semibold'>{label}</span>
        <span className='mt-0.5 block truncate font-mono text-xs text-muted-foreground'>
          {path}
        </span>
      </span>

      {isSelected && <Check size={18} className='shrink-0 text-blue-500' />}
    </button>
  );
};

export { GLOBAL_REPOSITORY_ID };
