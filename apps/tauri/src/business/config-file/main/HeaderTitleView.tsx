import type { StorageConfigFile } from '@/lib/gateway/config-file/types';
import { EntryIconView } from '../EntryIconView';
import type { PaneType } from '../usePaneType';

type Props = {
  paneType: PaneType;
  selectedFile: StorageConfigFile | null;
};

export const HeaderTitleView = ({ paneType, selectedFile }: Props) => {
  if (paneType === 'create-entry') {
    return <div className='text-sm text-muted-foreground'></div>;
  }

  if (selectedFile) {
    return (
      <div className='min-w-0 flex items-center gap-2'>
        <span className='size-6 inline-flex items-center justify-center text-base rounded-sm overflow-hidden'>
          <EntryIconView
            isDirectory={selectedFile.isDirectory}
            iconUrl={selectedFile.iconUrl}
            imageClassName='size-5 rounded-sm object-cover border'
          />
        </span>
        <div className='min-w-0'>
          <p className='text-sm font-medium truncate'>{selectedFile.name}</p>
          <p className='text-xs text-muted-foreground truncate'>
            {selectedFile.path}
          </p>
        </div>
      </div>
    );
  }

  return <div className='text-sm text-muted-foreground'></div>;
};
