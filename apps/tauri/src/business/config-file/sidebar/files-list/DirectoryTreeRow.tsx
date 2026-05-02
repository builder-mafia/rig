import { useSuspenseQuery } from '@tanstack/react-query';
import { ChevronRight, Loader2 } from 'lucide-react';
import { Suspense, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useService } from '@/business/ServiceContext';
import type { ScannedFile } from '@/lib/gateway/config-file/types';
import { EntryIconView } from '../../EntryIconView';

const getErrorMessage = (error: unknown) => {
  return error instanceof Error ? error.message : 'Failed to read folder.';
};

const DirectoryLoadingView = () => {
  return (
    <div className='ml-2 border-l border-border/70 py-1 pl-3 text-xs text-muted-foreground'>
      <Loader2 className='size-4 animate-spin' />
    </div>
  );
};

const DirectoryErrorView = ({ error }: { error: unknown }) => {
  return (
    <div className='ml-2 border-l border-border/70 py-1 pl-3 text-xs text-destructive'>
      {getErrorMessage(error)}
    </div>
  );
};

export const DirectoryChildrenView = ({ path }: { path: string }) => {
  const { configFileManager } = useService();
  const { data: entries } = useSuspenseQuery({
    queryKey: ['directory-entries', path],
    queryFn: () => configFileManager.readDirectoryFiles(path),
    staleTime: 1000 * 60 * 5,
  });

  if (entries.length === 0) {
    return <></>;
  }

  return (
    <div className='ml-2 border-l border-border/70 pl-2'>
      {entries.map(entry => (
        <DirectoryTreeRow key={entry.path} entry={entry} />
      ))}
    </div>
  );
};

export const DirectoryTreeRow = ({ entry }: { entry: ScannedFile }) => {
  if (!entry.isDirectory) {
    return <DirectoryFileTreeRow entry={entry} />;
  }

  return <DirectoryFolderTreeRow entry={entry} />;
};

const DirectoryFileTreeRow = ({ entry }: { entry: ScannedFile }) => {
  return (
    <div>
      <button
        type='button'
        className='flex w-full min-w-0 cursor-default items-center gap-1 rounded-md px-2 py-1.5 text-left hover:bg-secondary'
      >
        <span className='inline-flex size-5 shrink-0 items-center justify-center'>
          <EntryIconView isDirectory={false} />
        </span>
        <span className='min-w-0 flex-1'>
          <span className='block truncate text-sm font-medium'>
            {entry.name}
          </span>
          <span className='block truncate text-xs text-muted-foreground'>
            {entry.path}
          </span>
        </span>
      </button>
    </div>
  );
};

const DirectoryFolderTreeRow = ({ entry }: { entry: ScannedFile }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        type='button'
        onClick={() => setIsOpen(current => !current)}
        className='flex w-full min-w-0 cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-left hover:bg-secondary'
      >
        <ChevronRight
          className={`size-3 shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-90' : ''}`}
        />
        <span className='inline-flex size-5 shrink-0 items-center justify-center'>
          <EntryIconView isDirectory={true} />
        </span>
        <span className='min-w-0 flex-1'>
          <span className='block truncate text-sm font-medium'>
            {entry.name}
          </span>
          <span className='block truncate text-xs text-muted-foreground'>
            {entry.path}
          </span>
        </span>
      </button>
      {isOpen && (
        <ErrorBoundary
          fallbackRender={({ error }) => <DirectoryErrorView error={error} />}
          resetKeys={[entry.path]}
        >
          <Suspense fallback={<DirectoryLoadingView />}>
            <DirectoryChildrenView path={entry.path} />
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );
};

export const DirectoryChildrenLoadingView = DirectoryLoadingView;
export const DirectoryChildrenErrorView = DirectoryErrorView;
