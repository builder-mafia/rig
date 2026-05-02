import { Button } from '@allin/ui';
import { Trash2 } from 'lucide-react';
import type { ContentType } from '../contentTypeAtom';
import type { SelectedFile } from '../SelectionContext';

type Props = {
  paneType: ContentType;
  selectedFile: SelectedFile | null;
};

export const HeaderActionsView = ({ paneType, selectedFile }: Props) => {
  const isCreateEntryPane = paneType === 'create-entry';

  return (
    <div className='flex items-center gap-2'>
      {paneType === 'content' &&
      selectedFile &&
      selectedFile.updatedAt > selectedFile.createdAt ? (
        <span className='text-xs text-amber-600 font-medium'>
          Changes occurred
        </span>
      ) : null}
      <Button
        onClick={() => {}}
        size='sm'
        variant='outline'
        disabled={isCreateEntryPane}
      >
        <Trash2 className='size-4' />
        Remove
      </Button>
    </div>
  );
};
