'use client';

import {
  type AllModelIds,
  type LLMProviderName,
  LLMProviderNameSchema,
  MODEL_IDS_PER_PROVIDER,
} from '@allin/ai';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@allin/ui';
import * as React from 'react';
import { getProviderIcon } from '@/business/logo/ProviderIconMap';
import {
  useCommandDialog,
  useCommandDialogView,
} from '../useCommandDialogView';

const PROVIDERS = LLMProviderNameSchema.options;

export function ModelSelectView() {
  const { isOpen } = useCommandDialogView('model-select');
  const { close } = useCommandDialog();
  const [value, setValue] = React.useState('');

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      close();
      setValue('');
    }
  };

  const handleSelectModel = (
    providerId: LLMProviderName,
    modelId: AllModelIds,
  ) => {
    console.log('Selected model:', modelId, 'Provider:', providerId);
    close();
  };

  if (!isOpen) return null;

  return (
    <CommandDialog
      open={isOpen}
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
                onSelect={() => handleSelectModel(providerId, modelId)}
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
