import { useDraggable } from '@dnd-kit/react';
import type { z } from 'zod/v4';
import type { StorageConfigFile } from '@/lib/gateway/config-file/types';
import { DRAGGING_FILE_SYMBOL } from './constants';
import type { DraggableFileDataSchema } from './type-schema';

export const FolderRow = ({
  folder,
  groupId,
}: {
  folder: StorageConfigFile & { isDirectory: true };
  groupId: string | null;
}) => {
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

  return (
    <div
      className={`cursor-pointer hover:bg-secondary ${isDragging ? ' outline-1 rounded-md bg-gray-400/20' : ''}`}
    >
      <div
        className={`${isDragging ? 'bg-background rounded-md shadow-md border' : 'bg-transparent'}`}
        ref={draggableRef}
      >
        <li className='relative list-none'>
          <div className={`rounded-md px-2 py-2`}>
            <p className='truncate text-sm font-medium'>{folder.name}</p>
            <p className='truncate text-xs text-muted-foreground'>
              {folder.path}
            </p>
          </div>
        </li>
      </div>
    </div>
  );
};
