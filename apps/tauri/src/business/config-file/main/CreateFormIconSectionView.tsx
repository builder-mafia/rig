import { Button, Popover, PopoverContent, PopoverTrigger } from '@allin/ui';
import { FileJson2, Folder } from 'lucide-react';
import type { ChangeEvent, RefObject } from 'react';
import { APPLICATION_ICON_PRESETS } from '../AppIconPresets';

type Props = {
  isDirectory: boolean;
  iconType: 'preset' | 'uploaded' | null;
  iconValue: string | null;
  iconDisplayUrl: string | null;
  isDarkMode: boolean;
  isIconPopoverOpen: boolean;
  iconUploadInputRef: RefObject<HTMLInputElement | null>;
  onOpenChange: (isOpen: boolean) => void;
  onUploadImage: (event: ChangeEvent<HTMLInputElement>) => void;
  onSelectPreset: (presetId: string) => void;
  onClearIcon: () => void;
};

export const CreateFormIconSectionView = ({
  isDirectory,
  iconType,
  iconValue,
  iconDisplayUrl,
  isDarkMode,
  isIconPopoverOpen,
  iconUploadInputRef,
  onOpenChange,
  onUploadImage,
  onSelectPreset,
  onClearIcon,
}: Props) => {
  return (
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

        <Popover open={isIconPopoverOpen} onOpenChange={onOpenChange}>
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
                  onChange={onUploadImage}
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
                      onClick={() => onSelectPreset(preset.id)}
                    >
                      <img
                        src={isDarkMode ? preset.dark : preset.light}
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
                  onClick={onClearIcon}
                >
                  Clear
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
