import { pointerIntersection } from '@dnd-kit/collision';
import { useDroppable } from '@dnd-kit/react';
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
      <div className='px-2 pt-1.5'>
        <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground group-data-[drop-target=true]:text-blue-400 group-data-[drop-target=true]:font-bold'>
          {group.name}
        </p>
      </div>
      {configFiles.length > 0 && (
        <div className='mt-[-2px] ml-3 flex min-h-10 flex-col gap-1 rounded-md transition-colors group-data-[drop-target=true]:bg-blue-300/40'>
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
