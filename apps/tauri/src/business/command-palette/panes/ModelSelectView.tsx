'use client';

import {
  type AllModelIds,
  MODEL_IDS_PER_PROVIDER,
  type ProviderId,
  ProviderIdSchema,
} from '@allin/ai';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@allin/ui';
import { useState } from 'react';
import { useCommandPalette } from '@/business/command-palette/useCommandPalette';
import { getProviderIcon } from '@/business/logo/ProviderIconMap';

const PROVIDERS = ProviderIdSchema.options;

export function ModelSelectView() {
  const { close } = useCommandPalette();
  const [value, setValue] = useState('');

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      close();
      setValue('');
    }
  };

  const changeModel = (providerId: ProviderId, modelId: AllModelIds) => {
    close();
  };

  return (
    <CommandDialog
      open
      onOpenChange={handleOpenChange}
      value={value}
      onValueChange={setValue}
    >
      <CommandInput placeholder='Search models...' className='h-8 text-xs' />
      <CommandEmpty className='py-4 text-sm mx-auto'>
        No models found.
      </CommandEmpty>
      <CommandList className='max-h-[400px]'>
        {PROVIDERS.map(providerId => (
          <CommandGroup
            key={providerId}
            heading={
              <div className='flex items-center gap-1.5'>
                {getProviderIcon(providerId, 'size-3')}
                <span className='font-extrabold text-primary text-xs capitalize'>
                  {providerId}
                </span>
              </div>
            }
            className='[&_[cmdk-group-heading]]:py-1'
          >
            {MODEL_IDS_PER_PROVIDER[providerId].map(modelId => (
              <CommandItem
                key={modelId}
                value={`${providerId} ${modelId}`}
                onSelect={() => changeModel(providerId, modelId)}
                className='py-0 px-2 text-xs min-h-0'
              >
                <span>{modelId}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
