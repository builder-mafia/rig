import { Button } from '@allin/ui';
import { Save, Trash2 } from 'lucide-react';
import { FINDER_ICON_PATH } from '../configFileWorkbenchUtils';

type Props = {
  pane: 'content' | 'create-entry';
  isDirty: boolean;
  finderTargetPath: string | null;
  hasSelectedConfigFile: boolean;
  canSave: boolean;
  onOpenInFinder: () => void;
  onRemoveSelectedEntry: () => void;
  onSaveActiveFile: () => void;
};

export const HeaderActionsView = ({
  pane,
  isDirty,
  finderTargetPath,
  hasSelectedConfigFile,
  canSave,
  onOpenInFinder,
  onRemoveSelectedEntry,
  onSaveActiveFile,
}: Props) => {
  const isCreateEntryPane = pane === 'create-entry';

  return (
    <div className='flex items-center gap-2'>
      {pane === 'content' && isDirty ? (
        <span className='text-xs text-amber-600 font-medium'>Unsaved</span>
      ) : null}
      <Button
        onClick={onRemoveSelectedEntry}
        size='sm'
        variant='outline'
        disabled={!hasSelectedConfigFile || isCreateEntryPane}
      >
        <Trash2 className='size-4' />
        Remove
      </Button>
      <Button onClick={onSaveActiveFile} size='sm' disabled={!canSave}>
        <Save className='size-4' />
        Save
      </Button>
    </div>
  );
};
