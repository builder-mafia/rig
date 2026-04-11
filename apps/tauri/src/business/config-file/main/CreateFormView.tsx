import { Button, Input } from '@allin/ui';
import { use } from 'react';
import { ConfigFileWorkbenchContext } from '../ConfigFileWorkbenchProvider';
import { CreateFormIconSectionView } from './CreateFormIconSectionView';
import { CreateFormPathSectionView } from './CreateFormPathSectionView';
import { CreateFormTypeSectionView } from './CreateFormTypeSectionView';

export const CreateFormView = () => {
  const context = use(ConfigFileWorkbenchContext);

  if (!context) {
    throw new Error(
      'CreateFormView must be used within ConfigFileWorkbenchProvider',
    );
  }

  return (
    <div className='h-full flex items-center justify-center p-6'>
      <div className='w-full max-w-xl rounded-xl border bg-card p-6 flex flex-col gap-4'>
        <div>
          <h2 className='text-lg font-semibold'>Add Settings Entry</h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Register a local file or folder and browse it from the sidebar.
          </p>
        </div>
        <CreateFormTypeSectionView
          isDirectory={context.newIsDirectory}
          onSelectFile={() => context.setNewIsDirectory(false)}
          onSelectFolder={() => context.setNewIsDirectory(true)}
        />

        <CreateFormIconSectionView
          isDirectory={context.newIsDirectory}
          iconType={context.newIconType}
          iconValue={context.newIconValue}
          iconDisplayUrl={context.newIconDisplayUrl}
          isDarkMode={context.isDarkMode}
          isIconPopoverOpen={context.isIconPopoverOpen}
          iconUploadInputRef={context.iconUploadInputRef}
          onOpenChange={context.setNewIconPopoverOpen}
          onUploadImage={event => {
            void context.uploadIcon(event);
          }}
          onSelectPreset={context.selectPresetIcon}
          onClearIcon={context.clearIcon}
        />

        <div className='flex flex-col gap-2'>
          <label className='text-sm font-medium' htmlFor='config-file-name'>
            Name
          </label>
          <Input
            id='config-file-name'
            placeholder={
              context.newIsDirectory
                ? 'e.g. Neovim Config'
                : 'e.g. Zed Settings'
            }
            value={context.newName}
            onChange={event => context.setNewName(event.target.value)}
          />
        </div>

        <CreateFormPathSectionView
          isDirectory={context.newIsDirectory}
          path={context.newPath}
          isPickingPath={context.isPickingPath}
          onChangePath={context.setNewPath}
          onBrowsePath={() => {
            void context.pickPath();
          }}
        />

        <div className='flex items-center justify-end gap-2 pt-2'>
          <Button
            type='button'
            variant='outline'
            onClick={() => context.setPane('content')}
          >
            Cancel
          </Button>
          <Button
            type='button'
            onClick={() => {
              void context.createEntry();
            }}
          >
            {context.newIsDirectory ? 'Add Folder' : 'Add File'}
          </Button>
        </div>
      </div>
    </div>
  );
};
