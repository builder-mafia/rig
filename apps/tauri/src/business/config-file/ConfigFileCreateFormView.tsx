import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@allin/ui';
import { FileJson2, Folder } from 'lucide-react';
import { APPLICATION_ICON_PRESETS } from './applicationIconPresets';
import { useConfigFileWorkbenchPane } from './ConfigFileWorkbenchPaneState';
import { useConfigFileWorkbench } from './ConfigFileWorkbenchProvider';

export const ConfigFileCreateFormView = () => {
  const { setPane } = useConfigFileWorkbenchPane();
  const {
    newIsDirectory: isDirectory,
    newName: name,
    newPath: path,
    newIconType: iconType,
    newIconValue: iconValue,
    newIconDisplayUrl: iconDisplayUrl,
    isIconPopoverOpen,
    isDarkMode,
    isPickingPath,
    iconUploadInputRef,
    setNewIsDirectory,
    setNewName,
    setNewPath,
    setNewIconPopoverOpen,
    uploadIcon,
    selectPresetIcon,
    clearIcon,
    pickPath,
    createEntry,
  } = useConfigFileWorkbench();

  return (
    <div className='h-full flex items-center justify-center p-6'>
      <div className='w-full max-w-xl rounded-xl border bg-card p-6 flex flex-col gap-4'>
        <div>
          <h2 className='text-lg font-semibold'>Add Settings Entry</h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Register a local file or folder and browse it from the sidebar.
          </p>
        </div>

        <div className='flex flex-col gap-2'>
          <span className='text-sm font-medium'>Type</span>
          <div className='flex gap-2'>
            <Button
              type='button'
              variant={!isDirectory ? 'default' : 'outline'}
              onClick={() => setNewIsDirectory(false)}
            >
              File
            </Button>
            <Button
              type='button'
              variant={isDirectory ? 'default' : 'outline'}
              onClick={() => setNewIsDirectory(true)}
            >
              Folder
            </Button>
          </div>
        </div>

        <div className='flex flex-col gap-2'>
          <span className='text-sm font-medium'>Icon</span>
          <div className='flex items-center gap-2'>
            <span className='size-10 rounded-md border bg-muted/30 inline-flex items-center justify-center overflow-hidden'>
              {iconType === 'uploaded' && iconValue ? (
                <img
                  src={iconValue}
                  alt='selected icon'
                  className='size-full object-cover'
                />
              ) : iconDisplayUrl ? (
                <img
                  src={iconDisplayUrl}
                  alt='selected icon'
                  className='size-full object-cover'
                />
              ) : isDirectory ? (
                <Folder className='size-5 text-amber-500' />
              ) : (
                <FileJson2 className='size-5 text-muted-foreground' />
              )}
            </span>

            <Popover
              open={isIconPopoverOpen}
              onOpenChange={setNewIconPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button type='button' variant='outline'>
                  Add Icon
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-[320px] p-3' align='start'>
                <div className='flex flex-col gap-3'>
                  <div className='flex items-center justify-between gap-2'>
                    <p className='text-sm font-medium'>Upload</p>
                    <Button
                      type='button'
                      size='sm'
                      variant='outline'
                      onClick={() => iconUploadInputRef.current?.click()}
                    >
                      Upload Image
                    </Button>
                    <input
                      ref={iconUploadInputRef}
                      type='file'
                      accept='image/*'
                      className='hidden'
                      onChange={event => {
                        void uploadIcon(event);
                      }}
                    />
                  </div>

                  <div className='h-px bg-border' />

                  <div className='flex flex-col gap-2'>
                    <p className='text-sm font-medium'>Presets</p>
                    <div className='grid grid-cols-4 gap-2'>
                      {APPLICATION_ICON_PRESETS.map(preset => (
                        <button
                          type='button'
                          key={preset.id}
                          title={preset.label}
                          className={`h-10 rounded-md border text-lg transition-colors ${
                            iconType === 'preset' && iconValue === preset.id
                              ? 'bg-accent border-accent-foreground/20'
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => selectPresetIcon(preset.id)}
                        >
                          <img
                            src={
                              isDarkMode
                                ? preset.darkIconUrl
                                : preset.lightIconUrl
                            }
                            alt={preset.label}
                            className='mx-auto size-6 object-contain'
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className='flex justify-end'>
                    <Button
                      type='button'
                      size='sm'
                      variant='ghost'
                      onClick={clearIcon}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className='flex flex-col gap-2'>
          <label className='text-sm font-medium' htmlFor='config-file-name'>
            Name
          </label>
          <Input
            id='config-file-name'
            placeholder={
              isDirectory ? 'e.g. Neovim Config' : 'e.g. Zed Settings'
            }
            value={name}
            onChange={event => setNewName(event.target.value)}
          />
        </div>

        <div className='flex flex-col gap-2'>
          <label className='text-sm font-medium' htmlFor='config-file-path'>
            Path
          </label>
          <div className='flex items-center gap-2'>
            <Input
              id='config-file-path'
              placeholder={
                isDirectory
                  ? 'e.g. ~/.config/nvim'
                  : 'e.g. ~/.config/zed/settings.json'
              }
              value={path}
              onChange={event => setNewPath(event.target.value)}
            />
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                void pickPath();
              }}
              disabled={isPickingPath}
            >
              {isPickingPath ? 'Opening...' : 'Browse'}
            </Button>
          </div>
          <p className='text-xs text-muted-foreground'>
            {isDirectory
              ? 'Folder entries expand into a tree so you can browse child files.'
              : 'File entries open directly in the editor.'}
          </p>
        </div>

        <div className='flex items-center justify-end gap-2 pt-2'>
          <Button
            type='button'
            variant='outline'
            onClick={() => setPane('content')}
          >
            Cancel
          </Button>
          <Button
            type='button'
            onClick={() => {
              void createEntry();
            }}
          >
            {isDirectory ? 'Add Folder' : 'Add File'}
          </Button>
        </div>
      </div>
    </div>
  );
};
