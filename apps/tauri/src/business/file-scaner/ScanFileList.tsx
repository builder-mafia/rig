import { Button } from '@allin/ui';
import { ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { v4 } from 'uuid';
import type {
  StorageConfigFile,
  StorageGroup,
} from '@/lib/gateway/config-file/types';
import { getApplicationIconUrl } from '../config-file/AppIconPresets';
import { useConfigFile } from '../config-file/useConfigFile';
import { Group } from './Group';
import type { ScanFile } from './scan-file';

type ScanFileListProps = {
  files: ScanFile[];
};

const doGroupping = (files: ScanFile[]) => {
  return files.reduce<Record<string, ScanFile[]>>((acc, file) => {
    if (!acc[file.groupId]) {
      acc[file.groupId] = [];
    }

    acc[file.groupId].push(file);
    return acc;
  }, {});
};

const getNextOrder = <T extends { order: number }>(items: T[]) => {
  if (items.length === 0) {
    return 0;
  }

  return Math.max(...items.map(item => item.order)) + 1;
};

const getFilesByGroupId = (
  files: StorageConfigFile[],
  groupId: string | null,
) => {
  return files.filter(file => file.groupId === groupId);
};

export const ScanFileList = ({ files }: ScanFileListProps) => {
  const { groups, configFiles, createConfigFile, createGroup } =
    useConfigFile();

  const groupedFiles = useMemo(() => {
    const sortedFiles = [...files].sort(
      (a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0),
    );

    return doGroupping(sortedFiles);
  }, [files]);

  const [ignoredFilePaths, setIgnoredFilePaths] = useState<Set<string>>(
    () => new Set(),
  );

  const selectedFiles = useMemo(() => {
    return files.filter(file => !ignoredFilePaths.has(file.resolvedPath));
  }, [files, ignoredFilePaths]);

  const toggleIgnoredFile = (filePath: string) => {
    setIgnoredFilePaths(prev => {
      const next = new Set(prev);

      if (next.has(filePath)) {
        next.delete(filePath);
      } else {
        next.add(filePath);
      }

      return next;
    });
  };

  const doGenerate = async (groupId: string, items: ScanFile[]) => {
    let targetGroup = groups.find(group => group.name === groupId) ?? null;

    if (!targetGroup) {
      const now = Date.now();
      targetGroup = await createGroup({
        id: v4(),
        name: groupId,
        iconUrl: getApplicationIconUrl(groupId),
        createdAt: now,
        updatedAt: now,
        order: getNextOrder(groups),
      });
    }

    let nextFileOrder = getNextOrder(
      getFilesByGroupId(configFiles, targetGroup.id),
    );

    for (const item of items) {
      const now = Date.now();
      await createConfigFile({
        id: v4(),
        name: item.name,
        path: item.resolvedPath,
        isDirectory: item.isDirectory,
        iconUrl: null,
        groupId: targetGroup.id,
        createdAt: now,
        updatedAt: now,
        order: nextFileOrder,
      });

      nextFileOrder += 1;
    }
  };

  const handleContinue = async () => {
    const groups = doGroupping(selectedFiles);

    for (const [groupId, groupedItems] of Object.entries(groups)) {
      await doGenerate(groupId, groupedItems);
    }
  };

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex flex-col gap-2'>
          <h1 className='text-3xl font-semibold text-slate-900'>
            Select files to add
          </h1>
          <p className='text-sm leading-5 text-slate-500'>
            You can always change this{' '}
            <span className='font-bold text-slate-700'>later</span>.
          </p>
        </div>
        <div className='flex flex-col items-start gap-2 sm:items-end'>
          <ContinueButton
            selectedFiles={selectedFiles}
            onContinue={handleContinue}
          />
        </div>
      </div>
      {Object.entries(groupedFiles).map(([groupId, groupedItems]) => (
        <Group
          key={groupId}
          groupId={groupId}
          groupedItems={groupedItems}
          ignoredFilePaths={ignoredFilePaths}
          toggleIgnoredFile={toggleIgnoredFile}
        />
      ))}
    </div>
  );
};

type ContinueButtonProps = {
  selectedFiles: ScanFile[];
  onContinue: (selectedFiles: ScanFile[]) => void;
};

const ContinueButton = ({ selectedFiles, onContinue }: ContinueButtonProps) => {
  return (
    <Button
      variant='blue'
      size='lg'
      onClick={() => onContinue(selectedFiles)}
      className='group h-11 cursor-pointer rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(37,99,235,0.28)] transition hover:from-sky-600 hover:to-blue-700 hover:shadow-[0_14px_34px_rgba(37,99,235,0.34)]'
    >
      Continue
      <ChevronRight className='size-4 transition-transform group-hover:translate-x-0.5' />
    </Button>
  );
};
