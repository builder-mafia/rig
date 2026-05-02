import { useDraggable } from '@dnd-kit/react';
import { useSetAtom } from 'jotai';
import type { z } from 'zod/v4';
import type { StorageConfigFile } from '@/lib/gateway/config-file/types';
import { contentTypeAtom } from '../../contentTypeAtom';
import { useSelectionContext } from '../../SelectionContext';
import { useFileSystem } from '../../useFlieSystem';
import { DRAGGING_FILE_SYMBOL } from './constants';
import type { DraggableFileDataSchema } from './type-schema';

export const FileRow = ({
  file,
  groupId,
}: {
  file: StorageConfigFile;
  groupId: string | null;
}) => {
  const { ref: draggableRef, isDragging } = useDraggable<
    z.infer<typeof DraggableFileDataSchema>
  >({
    id: file.id,
    type: DRAGGING_FILE_SYMBOL,
    data: {
      kind: 'file',
      fileId: file.id,
      groupId,
    },
  });
  const { setSelectedFile } = useSelectionContext();
  const setContentType = useSetAtom(contentTypeAtom);
  const { readFile } = useFileSystem();

  const onClick = async () => {
    const content = await readFile(file.path);
    setSelectedFile({
      fileName: file.name,
      path: file.path,
      content,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    });
    setContentType('content');
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLLIElement>) => {
    if (e.key === 'Enter') {
      onClick();
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
          onClick={onClick}
          onKeyDown={onKeyDown}
          className='relative list-none'
        >
          <div className={`rounded-md p-3`}>
            <p className='truncate text-sm font-medium select-none'>
              {file.name}
            </p>
          </div>
        </li>
      </div>
    </div>
  );
};
