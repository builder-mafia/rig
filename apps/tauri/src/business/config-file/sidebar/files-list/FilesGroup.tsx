import { pointerIntersection } from '@dnd-kit/collision';
import { useDroppable } from '@dnd-kit/react';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type z from 'zod/v4';
import type {
  StorageConfigFile,
  StorageGroup,
} from '@/lib/gateway/config-file/types';
import { DRAGGING_FILE_SYMBOL } from './constants';
import { FileRow } from './FileRow';
import { FolderRow } from './FolderRow';
import type { DroppableGroupDataSchema } from './type-schema';

export const FilesGroup = ({
  group,
  configFiles,
}: {
  group: StorageGroup;
  configFiles: StorageConfigFile[];
}) => {
  const groupId = group.id;
  const [isOpen, setIsOpen] = useState(true);
  const { ref: droppableRef, isDropTarget } = useDroppable<
    z.infer<typeof DroppableGroupDataSchema>
  >({
    id: groupId,
    accept: DRAGGING_FILE_SYMBOL,
    collisionDetector: pointerIntersection,
    data: {
      kind: 'group-container',
      groupId,
    },
  });

  return (
    <section
      data-drop-target={isDropTarget}
      ref={droppableRef}
      className={`group relative flex flex-col gap-1`}
    >
      <button
        type='button'
        onClick={() => setIsOpen(current => !current)}
        className='flex min-w-0 flex-row items-center gap-1.5 rounded-md px-1 py-2 text-left hover:bg-secondary'
      >
        <ChevronRight
          className={`size-3 shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-90' : ''}`}
        />
        {group.iconUrl ? (
          <img
            src={group.iconUrl}
            alt={group.name}
            className='size-4 shrink-0 rounded-md'
          />
        ) : (
          <div className='flex size-4 shrink-0 select-none items-center justify-center rounded-md border bg-background text-xs font-semibold text-muted-foreground'>
            {group.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <p className='min-w-0 truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground select-none group-data-[drop-target=true]:font-bold group-data-[drop-target=true]:text-blue-400'>
          {group.name}
        </p>
      </button>
      {isOpen && configFiles.length > 0 && (
        <div className='mt-[-2px] flex min-h-10 flex-col gap-0 rounded-md transition-colors group-data-[drop-target=true]:bg-blue-300/40'>
          {configFiles.map(file =>
            file.isDirectory ? (
              <FolderRow
                key={file.id}
                folder={file as StorageConfigFile & { isDirectory: true }}
                groupId={groupId}
              />
            ) : (
              <FileRow key={file.id} file={file} groupId={groupId} />
            ),
          )}
        </div>
      )}
    </section>
  );
};
