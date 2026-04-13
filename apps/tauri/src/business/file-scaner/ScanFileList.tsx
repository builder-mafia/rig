import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@allin/ui';
import { getApplicationIconUrl } from '../config-file/AppIconPresets';
import type { ScanFile } from './scan-file';

type ScanFileListProps = {
  files: ScanFile[];
};

export const ScanFileList = ({ files }: ScanFileListProps) => {
  return (
    <div className='flex flex-col gap-2'>
      {files.map(file => (
        <FileItem key={`${file.resolvedPath}-${file.name}`} file={file} />
      ))}
    </div>
  );
};

type FileItemProps = {
  file: ScanFile;
};

const FileItem = ({ file }: FileItemProps) => {
  const { name, resolvedPath } = file;
  const icon = getApplicationIconUrl(file.groupId) ?? '';
  return (
    <Item>
      <ItemMedia>
        <img src={icon} alt={name} className='w-6 h-6' />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{name}</ItemTitle>
        <ItemDescription>{resolvedPath}</ItemDescription>
      </ItemContent>
    </Item>
  );
};
