import { Filter } from '@allin/utils';
import { type DragEndEvent, PointerActivationConstraints } from '@dnd-kit/dom';
import { DragDropProvider, PointerSensor } from '@dnd-kit/react';
import { useEffect, useOptimistic, useTransition } from 'react';
import type {
  StorageConfigFile,
  StorageGroup,
} from '@/lib/gateway/config-file/types';
import { useConfigFile } from '../../useConfigFile';
import { FilesGroup } from './FilesGroup';
import {
  DraggableFileDataSchema,
  DroppableGroupDataSchema,
} from './type-schema';

type GroupedConfigFilesItem = {
  group: StorageGroup | null;
  configFiles: StorageConfigFile[];
};

const LONG_PRESS_DELAY_MS = 180;

const LONG_PRESS_POINTER_SENSOR = PointerSensor.configure({
  activationConstraints: [
    new PointerActivationConstraints.Delay({
      value: LONG_PRESS_DELAY_MS,
      tolerance: { x: 8, y: 8 },
    }),
  ],
});

const applyOptimisticFileUpdate = (
  state: GroupedConfigFilesItem[],
  updatedFile: StorageConfigFile,
): GroupedConfigFilesItem[] => {
  const targetGroupId = updatedFile.groupId;

  const withoutFile = state.map(item => ({
    ...item,
    configFiles: item.configFiles.filter(file => file.id !== updatedFile.id),
  }));

  return withoutFile.map(item => {
    const itemGroupId = item.group?.id ?? null;
    if (itemGroupId !== targetGroupId) {
      return item;
    }

    return {
      ...item,
      configFiles: [...item.configFiles, updatedFile].sort(
        (a, b) => a.order - b.order,
      ),
    };
  });
};

export const FilesList = () => {
  const [, startTransition] = useTransition();
  const {
    configFiles,
    groupedConfigFiles,
    updateConfigFile,
    fetchConfigFiles,
    fetchGroups,
  } = useConfigFile();
  const [optimisticGroupedConfigFiles, addOptimisticFileUpdate] = useOptimistic(
    groupedConfigFiles,
    applyOptimisticFileUpdate,
  );

  useEffect(() => {
    void fetchConfigFiles();
    void fetchGroups();
  }, [fetchConfigFiles, fetchGroups]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { success: sourceSuccess, data: sourceData } =
      DraggableFileDataSchema.safeParse(event.operation.source?.data);
    const { success: targetSuccess, data: targetData } =
      DroppableGroupDataSchema.safeParse(event.operation.target?.data);

    const isValidFinish = sourceSuccess && targetSuccess && !event.canceled;

    if (!isValidFinish) {
      return;
    }
    const sourceFileGroupId = sourceData.groupId;
    const targetGroupId = targetData.groupId;

    // if source file is in the same group as the target group, do nothing.
    if (sourceFileGroupId === targetGroupId) {
      return;
    }

    const maxOrderInTargetGroup = Math.max(
      ...(optimisticGroupedConfigFiles
        .find(({ group }) => group?.id === targetGroupId)
        ?.configFiles.map(file => file.order) ?? []),
      -Infinity,
    );

    const newOrder =
      maxOrderInTargetGroup === -Infinity ? 0 : maxOrderInTargetGroup + 1;

    const sourceFile = configFiles.find(file => file.id === sourceData.fileId);

    startTransition(async () => {
      if (sourceFile) {
        addOptimisticFileUpdate({
          ...sourceFile,
          groupId: targetGroupId,
          order: newOrder,
        });
      }

      await updateConfigFile(sourceData.fileId, {
        groupId: targetGroupId,
        order: newOrder,
      });
    });
  };

  return (
    <DragDropProvider
      sensors={[LONG_PRESS_POINTER_SENSOR]}
      onDragEnd={handleDragEnd}
    >
      <div className='flex-1 overflow-y-auto p-2'>
        <div className='flex flex-col gap-3'>
          {optimisticGroupedConfigFiles
            .filter(({ group }) => Filter.notNullish(group))
            .map(({ group, configFiles }) => {
              return (
                <FilesGroup
                  key={group!.id}
                  group={group!}
                  configFiles={configFiles}
                />
              );
            })}
          {optimisticGroupedConfigFiles
            .filter(item => item.group === null)
            .map(item => {
              return (
                <></>

                // <NoGroupSection
                //   key='no-group-section'
                //   files={item.configFiles}
                // />
              );
            })}
        </div>
      </div>
    </DragDropProvider>
  );
};
