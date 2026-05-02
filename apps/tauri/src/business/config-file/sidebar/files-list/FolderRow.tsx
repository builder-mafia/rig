import { useDraggable } from '@dnd-kit/react';
import { ChevronRight } from 'lucide-react';
import { Suspense, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import type { z } from 'zod/v4';
import type { StorageConfigFile } from '@/lib/gateway/config-file/types';
import { DRAGGING_FILE_SYMBOL } from './constants';
import {
  DirectoryChildrenErrorView,
  DirectoryChildrenLoadingView,
  DirectoryChildrenView,
} from './DirectoryTreeRow';
import type { DraggableFileDataSchema } from './type-schema';

export const FolderRow = ({
  folder,
  groupId,
}: {
  folder: StorageConfigFile & { isDirectory: true };
  groupId: string | null;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { ref: draggableRef, isDragging } = useDraggable<
    z.infer<typeof DraggableFileDataSchema>
  >({
    id: folder.id,
    type: DRAGGING_FILE_SYMBOL,
    data: {
      kind: 'file',
      fileId: folder.id,
      groupId,
    },
  });

  const onKeyDown = (e: React.KeyboardEvent<HTMLLIElement>) => {
    if (e.key === 'Enter') {
      setIsOpen(current => !current);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowRight') {
      setIsOpen(true);
    } else if (e.key === 'ArrowLeft') {
      setIsOpen(false);
    }
  };

  return (
    <div
      className={`cursor-pointer hover:bg-secondary ${isDragging ? ' outline-1 rounded-md bg-gray-400/20' : ''}`}
    >
      <div
        className={`${isDragging ? 'bg-background rounded-md shadow-md border' : 'bg-transparent'}`}
        ref={draggableRef}
      >
        <li
          onClick={() => setIsOpen(current => !current)}
          onKeyDown={onKeyDown}
          role='button'
          tabIndex={0}
          aria-expanded={isOpen}
          aria-label={`Toggle folder ${isOpen ? 'open' : 'closed'} ${folder.name}`}
          className='relative list-none flex flex-row items-center gap-1.5 p-3'
        >
          <span className='block truncate text-sm font-medium select-none'>
            {folder.name}
          </span>
          <ChevronRight
            className={`size-4 ml-auto shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-90' : ''}`}
          />
        </li>
        {isOpen && (
          <ErrorBoundary
            fallbackRender={({ error }) => (
              <DirectoryChildrenErrorView error={error} />
            )}
            resetKeys={[folder.path]}
          >
            <Suspense fallback={<DirectoryChildrenLoadingView />}>
              <DirectoryChildrenView path={folder.path} />
            </Suspense>
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
};
