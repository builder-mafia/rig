'use client';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  toast,
} from '@allin/ui';
import { Check, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useCommandPalette } from '@/business/command-palette/useCommandPalette';
import { useAppSettings } from '@/lib/gateway/app-setting/useAppSettings';
import { useSystemFonts } from '@/lib/gateway/app-setting/useSystemFonts';

const PREVIEW_TEXT = 'The quick brown fox jumps';

export const FontFamilyView = () => {
  const { close } = useCommandPalette();
  const { settings, saveFontFamily } = useAppSettings();
  const { fonts, isLoading } = useSystemFonts();
  const [value, setValue] = useState('');

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      close();
      setValue('');
    }
  };

  const handleSelect = (fontFamily: string | null) => {
    saveFontFamily.mutate(fontFamily, {
      onSuccess: () => {
        toast.success(
          fontFamily ? `Font changed to ${fontFamily}` : 'Font reset',
          { position: 'top-center', duration: 3000 },
        );
        close();
      },
    });
  };

  const currentFont = settings?.fontFamily ?? null;

  const sortedFonts = useMemo(() => {
    if (!currentFont) return fonts;
    return [...fonts].sort((a, b) => {
      if (a === currentFont) return -1;
      if (b === currentFont) return 1;
      return 0;
    });
  }, [fonts, currentFont]);

  return (
    <CommandDialog
      open
      onOpenChange={handleOpenChange}
      value={value}
      onValueChange={setValue}
    >
      <CommandInput placeholder='Search fonts...' />
      <CommandEmpty>
        {isLoading ? 'Loading system fonts...' : 'No fonts found.'}
      </CommandEmpty>
      <CommandList className='max-h-[min(600px,80dvh)]'>
        <CommandGroup
          heading={
            <span className='text-blue-500 font-semibold'>Font Family</span>
          }
        >
          <CommandItem onSelect={() => handleSelect(null)}>
            <div className='flex flex-1 items-center justify-between'>
              <div className='flex items-center gap-2'>
                <RotateCcw className='size-3.5 text-muted-foreground' />
                <span>System Default</span>
              </div>
              {currentFont === null && (
                <Check className='size-4 text-green-500' />
              )}
            </div>
          </CommandItem>
          {sortedFonts.map(fontName => {
            const isSelected = currentFont === fontName;
            return (
              <CommandItem
                key={fontName}
                onSelect={() => handleSelect(fontName)}
              >
                <div className='flex flex-1 items-center justify-between gap-4'>
                  <div className='flex flex-col gap-0.5 min-w-0'>
                    <span className='text-sm truncate'>{fontName}</span>
                    <span
                      className='text-xs text-muted-foreground truncate'
                      style={{ fontFamily: `"${fontName}"` }}
                    >
                      {PREVIEW_TEXT}
                    </span>
                  </div>
                  {isSelected && (
                    <Check className='size-4 shrink-0 text-green-500' />
                  )}
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
