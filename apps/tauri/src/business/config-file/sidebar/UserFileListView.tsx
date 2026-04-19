import { PointerActivationConstraints } from '@dnd-kit/dom';
import {
  DragDropProvider,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
} from '@dnd-kit/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  StorageConfigFile,
  StorageGroup,
} from '@/lib/gateway/config-file/types';
import { useConfigFile } from '../useConfigFile';

const UNGROUPED_CONTAINER_ID = 'ungrouped';
const EMPTY_DROP_ZONE_TEXT = 'Drop file here';
const LONG_PRESS_DELAY_MS = 180;
const FILE_DRAG_TYPE = 'config-file';
const MIN_ORDER_GAP = 0.000001;

const LONG_PRESS_POINTER_SENSOR = PointerSensor.configure({
  activationConstraints: [
    new PointerActivationConstraints.Delay({
      value: LONG_PRESS_DELAY_MS,
      tolerance: { x: 8, y: 8 },
    }),
  ],
});

type FileDragData = {
  kind: 'file';
  fileId: string;
  groupId: string | null;
};

type GroupContainerDropData = {
  kind: 'group-container';
  groupId: string | null;
};

type DropIndicator =
  | {
      kind: 'file';
      fileId: string;
      position: 'top' | 'bottom';
    }
  | {
      kind: 'container';
      groupId: string | null;
    }
  | null;

const getFileItemId = (fileId: string) => `file:${fileId}`;

const getContainerId = (groupId: string | null) => {
  return groupId === null ? UNGROUPED_CONTAINER_ID : `container:${groupId}`;
};

const getNextFileOrder = (configFiles: StorageConfigFile[]) => {
  if (configFiles.length === 0) {
    return 0;
  }

  return Math.max(...configFiles.map(file => file.order)) + 1;
};

const isFileDragData = (value: unknown): value is FileDragData => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const data = value as Partial<FileDragData>;
  return data.kind === 'file' && typeof data.fileId === 'string';
};

const isGroupContainerDropData = (
  value: unknown,
): value is GroupContainerDropData => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const data = value as Partial<GroupContainerDropData>;
  return data.kind === 'group-container';
};

const getTargetGroupId = (value: unknown) => {
  if (isFileDragData(value)) {
    return value.groupId;
  }

  if (isGroupContainerDropData(value)) {
    return value.groupId;
  }

  return undefined;
};

const getTargetConfigFiles = (
  groupedConfigFiles: Array<{
    group: StorageGroup | null;
    configFiles: StorageConfigFile[];
  }>,
  groupId: string | null,
) => {
  const targetGroup = groupedConfigFiles.find(
    item => (item.group?.id ?? null) === groupId,
  );

  return targetGroup?.configFiles ?? [];
};

const getDropIndicator = (
  groupedConfigFiles: Array<{
    group: StorageGroup | null;
    configFiles: StorageConfigFile[];
  }>,
  sourceData: FileDragData,
  targetData: unknown,
): DropIndicator => {
  const targetGroupId = getTargetGroupId(targetData);
  if (targetGroupId === undefined) {
    return null;
  }

  if (!isFileDragData(targetData) || targetData.fileId === sourceData.fileId) {
    return null;
  }

  if (targetGroupId !== sourceData.groupId) {
    return null;
  }

  const configFiles = getTargetConfigFiles(
    groupedConfigFiles,
    sourceData.groupId,
  );
  const sourceIndex = configFiles.findIndex(
    file => file.id === sourceData.fileId,
  );
  const targetIndex = configFiles.findIndex(
    file => file.id === targetData.fileId,
  );

  if (sourceIndex === -1 || targetIndex === -1) {
    return null;
  }

  return {
    kind: 'file',
    fileId: targetData.fileId,
    position: sourceIndex < targetIndex ? 'bottom' : 'top',
  };
};

const getReorderedFileOrders = (
  configFiles: StorageConfigFile[],
  sourceFileId: string,
  targetFileId: string,
) => {
  const sortedFiles = [...configFiles].sort((a, b) => a.order - b.order);
  const sourceIndex = sortedFiles.findIndex(file => file.id === sourceFileId);
  const targetIndex = sortedFiles.findIndex(file => file.id === targetFileId);

  if (sourceIndex === -1 || targetIndex === -1) {
    return null;
  }

  const sourceFile = sortedFiles[sourceIndex];
  const remainingFiles = sortedFiles.filter(file => file.id !== sourceFileId);
  const targetIndexInRemaining = remainingFiles.findIndex(
    file => file.id === targetFileId,
  );

  if (targetIndexInRemaining === -1) {
    return null;
  }

  const insertionIndex =
    sourceIndex < targetIndex
      ? targetIndexInRemaining + 1
      : targetIndexInRemaining;

  const previousFile = remainingFiles[insertionIndex - 1] ?? null;
  const nextFile = remainingFiles[insertionIndex] ?? null;

  const newOrder = (() => {
    if (!previousFile && !nextFile) {
      return 0;
    }

    if (!previousFile) {
      return nextFile.order - 1;
    }

    if (!nextFile) {
      return previousFile.order + 1;
    }

    return (previousFile.order + nextFile.order) / 2;
  })();

  const hasTightGap =
    previousFile != null &&
    nextFile != null &&
    nextFile.order - previousFile.order < MIN_ORDER_GAP;

  if (!hasTightGap) {
    return {
      nextOrder: newOrder,
      reorderedFiles: null,
    };
  }

  const reorderedFiles = [...remainingFiles];
  reorderedFiles.splice(insertionIndex, 0, sourceFile);

  return {
    nextOrder: insertionIndex,
    reorderedFiles,
  };
};

const hasActiveDropTarget = (
  source: { id: string | number } | null,
  target: { id: string | number } | null,
): source is { id: string | number } & NonNullable<typeof source> => {
  return source != null && target != null && source.id !== target.id;
};

export const UserFileListView = () => {
  const {
    groupedConfigFiles,
    updateConfigFile,
    fetchConfigFiles,
    fetchGroups,
  } = useConfigFile();
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<DropIndicator>(null);

  useEffect(() => {
    void fetchConfigFiles();
    void fetchGroups();
  }, [fetchConfigFiles, fetchGroups]);

  const activeFile = useMemo(() => {
    if (activeFileId == null) {
      return null;
    }

    for (const item of groupedConfigFiles) {
      const file = item.configFiles.find(
        configFile => configFile.id === activeFileId,
      );
      if (file) {
        return file;
      }
    }

    return null;
  }, [activeFileId, groupedConfigFiles]);

  const handleDragEnd = async (
    event: Parameters<
      NonNullable<React.ComponentProps<typeof DragDropProvider>['onDragEnd']>
    >[0],
  ) => {
    setActiveFileId(null);
    setDropIndicator(null);

    if (event.canceled) {
      return;
    }

    const { source, target } = event.operation;

    if (!hasActiveDropTarget(source, target) || target == null) {
      return;
    }

    if (!isFileDragData(source.data)) {
      return;
    }

    const targetGroupId = getTargetGroupId(target.data);
    if (targetGroupId === undefined) {
      return;
    }

    const sourceFile = getTargetConfigFiles(
      groupedConfigFiles,
      source.data.groupId,
    ).find(file => file.id === source.data.fileId);

    if (!sourceFile) {
      return;
    }

    if (targetGroupId === source.data.groupId && isFileDragData(target.data)) {
      const reorderedFileOrders = getReorderedFileOrders(
        getTargetConfigFiles(groupedConfigFiles, source.data.groupId),
        source.data.fileId,
        target.data.fileId,
      );

      if (!reorderedFileOrders) {
        return;
      }

      if (reorderedFileOrders.reorderedFiles) {
        await Promise.all(
          reorderedFileOrders.reorderedFiles.map((file, index) =>
            updateConfigFile(file.id, { order: index }),
          ),
        );

        return;
      }

      await updateConfigFile(source.data.fileId, {
        order: reorderedFileOrders.nextOrder,
      });

      return;
    }

    await updateConfigFile(source.data.fileId, {
      groupId: targetGroupId,
      order: getNextFileOrder(
        getTargetConfigFiles(groupedConfigFiles, targetGroupId),
      ),
    });
  };

  return (
    <DragDropProvider
      sensors={[LONG_PRESS_POINTER_SENSOR]}
      onDragStart={event => {
        const sourceData = event.operation.source?.data;
        if (isFileDragData(sourceData)) {
          setActiveFileId(sourceData.fileId);
        }
      }}
      onDragOver={event => {
        const sourceData = event.operation.source?.data;
        const targetData = event.operation.target?.data;

        if (!isFileDragData(sourceData)) {
          setDropIndicator(null);
          return;
        }

        setDropIndicator(
          getDropIndicator(groupedConfigFiles, sourceData, targetData),
        );
      }}
      onDragEnd={handleDragEnd}
    >
      <div className='flex-1 overflow-y-auto p-2'>
        <div className='flex flex-col gap-3'>
          {groupedConfigFiles.map(item => (
            <GroupSectionView
              key={item.group?.id ?? UNGROUPED_CONTAINER_ID}
              group={item.group}
              configFiles={item.configFiles}
              dropIndicator={dropIndicator}
            />
          ))}
        </div>
      </div>
      <DragOverlay>
        {activeFile ? <FileRowView file={activeFile} isOverlay /> : null}
      </DragOverlay>
    </DragDropProvider>
  );
};

type GroupSectionViewProps = {
  group: StorageGroup | null;
  configFiles: StorageConfigFile[];
  dropIndicator: DropIndicator;
};

const GroupSectionView = ({
  group,
  configFiles,
  dropIndicator,
}: GroupSectionViewProps) => {
  const title = group?.name ?? 'Ungrouped';
  const groupId = group?.id ?? null;
  const containerId = getContainerId(group?.id ?? null);
  const { ref: droppableRef, isDropTarget } = useDroppable({
    id: containerId,
    accept: FILE_DRAG_TYPE,
    data: {
      kind: 'group-container',
      groupId: group?.id ?? null,
    } satisfies GroupContainerDropData,
  });

  return (
    <section className='flex flex-col gap-1'>
      <div className='px-2 py-1'>
        <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
          {title}
        </p>
      </div>
      <div
        ref={droppableRef}
        className={`flex min-h-10 flex-col gap-1 rounded-md transition-colors ${
          isDropTarget ? 'bg-muted/40' : ''
        }`}
      >
        {configFiles.map(file => (
          <DraggableDroppableFileItemView
            key={file.id}
            file={file}
            groupId={groupId}
            insertPosition={
              dropIndicator?.kind === 'file' && dropIndicator.fileId === file.id
                ? dropIndicator.position
                : null
            }
          />
        ))}
        {dropIndicator?.kind === 'container' &&
        dropIndicator.groupId === groupId ? (
          <div className='h-0.5 rounded-full bg-primary/80' />
        ) : null}
      </div>
    </section>
  );
};

type DraggableDroppableFileItemViewProps = {
  file: StorageConfigFile;
  groupId: string | null;
  insertPosition: 'top' | 'bottom' | null;
};

const DraggableDroppableFileItemView = ({
  file,
  groupId,
  insertPosition,
}: DraggableDroppableFileItemViewProps) => {
  const sourceRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);
  const { ref: draggableRef, isDragging } = useDraggable({
    id: getFileItemId(file.id),
    type: FILE_DRAG_TYPE,
    element: sourceRef,
    data: {
      kind: 'file',
      fileId: file.id,
      groupId,
    } satisfies FileDragData,
  });
  const { ref: droppableRef } = useDroppable({
    id: `file-target:${file.id}`,
    accept: FILE_DRAG_TYPE,
    element: targetRef,
    data: {
      kind: 'file',
      fileId: file.id,
      groupId,
    } satisfies FileDragData,
  });

  return (
    <div
      ref={element => {
        sourceRef.current = element;
        draggableRef(element);
      }}
    >
      <div
        ref={element => {
          targetRef.current = element;
          droppableRef(element);
        }}
      >
        <FileRowView
          file={file}
          isPlaceholder={isDragging}
          insertPosition={insertPosition}
        />
      </div>
    </div>
  );
};

type FileRowViewProps = {
  file: StorageConfigFile;
  isOverlay?: boolean;
  isPlaceholder?: boolean;
  insertPosition?: 'top' | 'bottom' | null;
};

const FileRowView = ({
  file,
  isOverlay = false,
  isPlaceholder = false,
  insertPosition = null,
}: FileRowViewProps) => {
  if (isPlaceholder) {
    return <div className='h-[52px] rounded-md bg-muted/60' />;
  }

  return (
    <div className='relative'>
      {insertPosition === 'top' ? (
        <div className='absolute inset-x-0 -top-0.5 h-0.5 rounded-full bg-primary/80' />
      ) : null}
      <div
        className={`rounded-md px-2 py-2 ${
          isOverlay
            ? 'bg-background shadow-lg ring-1 ring-border'
            : 'hover:bg-muted/50'
        }`}
      >
        <p className='truncate text-sm font-medium'>{file.name}</p>
        <p className='truncate text-xs text-muted-foreground'>{file.path}</p>
      </div>
      {insertPosition === 'bottom' ? (
        <div className='absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-primary/80' />
      ) : null}
    </div>
  );
};
