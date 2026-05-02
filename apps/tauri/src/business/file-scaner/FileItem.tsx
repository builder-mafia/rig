import {
  Checkbox,
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@allin/ui';
import type { ScanFile } from './scan-file';

type FileItemProps = {
  file: ScanFile;
  isChecked: boolean;
  onCheckedChange: () => void;
};

export const FileItem = ({
  file,
  isChecked,
  onCheckedChange,
}: FileItemProps) => {
  const { name, resolvedPath } = file;

  return (
    <Item
      onClick={onCheckedChange}
      className={
        isChecked
          ? 'rounded-xl border border-sky-300 bg-sky-50/40 px-3 py-3 shadow-xs'
          : 'rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-xs'
      }
    >
      <Checkbox
        checked={isChecked}
        onCheckedChange={onCheckedChange}
        className='h-4 w-4 border-slate-300 data-[state=checked]:border-sky-500 data-[state=checked]:bg-sky-500'
        id={`${file.resolvedPath}-${file.name}`}
        name={`${file.resolvedPath}-${file.name}`}
      />
      <ItemContent className='select-none cursor-pointer'>
        <ItemTitle>{name}</ItemTitle>
        <ItemDescription>{resolvedPath}</ItemDescription>
      </ItemContent>
    </Item>
  );
};
