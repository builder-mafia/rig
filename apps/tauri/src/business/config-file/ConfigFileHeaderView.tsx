import { Button } from '@allin/ui';
import { Save, Trash2 } from 'lucide-react';
import { use } from 'react';
import { ConfigFileEntryIconView } from './ConfigFileEntryIconView';
import { ConfigFileWorkbenchContext } from './ConfigFileWorkbenchProvider';
import { FINDER_ICON_PATH } from './configFileWorkbenchUtils';

export const ConfigFileHeaderView = () => {
  const context = use(ConfigFileWorkbenchContext);

  if (!context) {
    throw new Error(
      'ConfigFileHeaderView must be used within ConfigFileWorkbenchProvider',
    );
  }

  const {
    pane,
    activeDisplayName,
    activeDisplayPath,
    activeIsDirectory,
    isRootItemActive,
    selectedRootIconUrl,
    isDirty,
    finderTargetPath,
    selectedConfigFile,
    canSave,
    openInFinder,
    removeSelectedEntry,
    saveActiveFile,
  } = context;

  const isCreateEntryPane = pane === 'create-entry';

  return (
    <div className='h-12 border-b px-4 flex items-center justify-between gap-2'>
      {isCreateEntryPane ? (
        <div className='text-sm text-muted-foreground'>
          Add a settings file or folder
        </div>
      ) : activeDisplayName && activeDisplayPath ? (
        <div className='min-w-0 flex items-center gap-2'>
          <span className='size-6 inline-flex items-center justify-center text-base rounded-sm overflow-hidden'>
            <ConfigFileEntryIconView
              isDirectory={activeIsDirectory}
              iconUrl={isRootItemActive ? selectedRootIconUrl : undefined}
              imageClassName='size-5 rounded-sm object-cover border'
            />
          </span>
          <div className='min-w-0'>
            <p className='text-sm font-medium truncate'>{activeDisplayName}</p>
            <p className='text-xs text-muted-foreground truncate'>
              {activeDisplayPath}
            </p>
          </div>
        </div>
      ) : (
        <div className='text-sm text-muted-foreground'>
          Select a file from the sidebar
        </div>
      )}

      <div className='flex items-center gap-2'>
        {!isCreateEntryPane && isDirty && (
          <span className='text-xs text-amber-600 font-medium'>Unsaved</span>
        )}
        <Button
          onClick={() => {
            void openInFinder();
          }}
          size='sm'
          variant='outline'
          className='h-9 gap-2 rounded-full border-sky-200 bg-gradient-to-b from-white to-sky-50 px-3 text-slate-700 shadow-sm hover:border-sky-300 hover:from-sky-50 hover:to-sky-100 hover:text-slate-900'
          disabled={!finderTargetPath || isCreateEntryPane}
        >
          <span className='inline-flex size-5 items-center justify-center overflow-hidden rounded-md bg-white shadow-[0_1px_2px_rgba(15,23,42,0.08)]'>
            <img
              src={FINDER_ICON_PATH}
              alt='Finder'
              className='size-4 object-cover'
            />
          </span>
          Show in Finder
        </Button>
        <Button
          onClick={() => {
            void removeSelectedEntry();
          }}
          size='sm'
          variant='outline'
          disabled={!selectedConfigFile || isCreateEntryPane}
        >
          <Trash2 className='size-4' />
          Remove
        </Button>
        <Button
          onClick={() => {
            void saveActiveFile();
          }}
          size='sm'
          disabled={!canSave}
        >
          <Save className='size-4' />
          Save
        </Button>
      </div>
    </div>
  );
};
