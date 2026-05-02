import {
  getApplicationIconLabel,
  getApplicationIconUrl,
} from '../config-file/AppIconPresets';
import { FileItem } from './FileItem';
import type { ScanFile } from './scan-file';

const toGroupLabel = (groupId: string) => {
  return groupId
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

export const Group = ({
  groupId,
  groupedItems,
  ignoredFilePaths,
  toggleIgnoredFile,
}: {
  groupId: string;
  groupedItems: ScanFile[];
  ignoredFilePaths: Set<string>;
  toggleIgnoredFile: (filePath: string) => void;
}) => {
  return (
    <section key={groupId} className='flex flex-col gap-2'>
      <div className='flex items-center gap-3 px-1 pt-3 pb-1'>
        {getApplicationIconUrl(groupId) ? (
          <img
            src={getApplicationIconUrl(groupId) ?? ''}
            alt={groupId}
            className='h-6 w-6 rounded-md'
          />
        ) : (
          <div className='flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-[10px] font-semibold text-slate-500'>
            {groupId.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div>
          <h2 className='text-xs font-semibold uppercase tracking-[0.05em] text-slate-700'>
            {getApplicationIconLabel(groupId) ?? toGroupLabel(groupId)}
          </h2>
          <p className='text-[12px] text-slate-400'>
            <span className='font-medium text-slate-500'>
              {groupedItems.length}
            </span>{' '}
            item{groupedItems.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>
      {groupedItems.map(file => (
        <FileItem
          key={`${file.resolvedPath}-${file.name}`}
          file={file}
          isChecked={!ignoredFilePaths.has(file.resolvedPath)}
          onCheckedChange={() => toggleIgnoredFile(file.resolvedPath)}
        />
      ))}
    </section>
  );
};
