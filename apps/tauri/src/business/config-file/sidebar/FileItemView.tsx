import { EntryIconView } from '../EntryIconView';

type Props = {
  name: string;
  path: string;
  isSelected: boolean;
  iconUrl: string | null;
  isDirectory: boolean;
  onSelect: () => void;
};

export const FileItemView = ({
  name,
  path,
  isSelected,
  iconUrl,
  isDirectory,
  onSelect,
}: Props) => {
  return (
    <div
      className={`relative rounded-md ${
        isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50'
      }`}
    >
      <button
        type='button'
        className='absolute inset-0 rounded-md'
        onClick={onSelect}
        aria-label={`Select ${name}`}
      />
      <div
        className={`flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors ${
          isSelected ? 'bg-accent text-accent-foreground' : ''
        }`}
      >
        <span className='mt-0.5 size-4 shrink-0' />
        <div className='flex min-w-0 flex-1 items-start gap-2 text-left'>
          <span className='mt-0.5 inline-flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-sm'>
            <EntryIconView isDirectory={isDirectory} iconUrl={iconUrl} />
          </span>
          <span className='min-w-0 flex-1'>
            <span className='block truncate text-sm font-medium'>{name}</span>
            <span className='block truncate text-xs text-muted-foreground'>
              {path}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};
