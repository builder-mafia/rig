import type { ContentType } from '../contentTypeAtom';
import { EntryIconView } from '../EntryIconView';
import type { SelectedFile } from '../SelectionContext';

type Props = {
  paneType: ContentType;
  selectedFile: SelectedFile | null;
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
            isDirectory={false}
            imageClassName='size-5 rounded-sm object-cover border'
          />
        </span>
        <div className='min-w-0'>
          <p className='text-sm font-medium truncate'>{selectedFile.fileName}</p>
          <p className='text-xs text-muted-foreground truncate'>
            {selectedFile.path}
          </p>
        </div>
      </div>
    );
  }

  return <div className='text-sm text-muted-foreground'></div>;
};
