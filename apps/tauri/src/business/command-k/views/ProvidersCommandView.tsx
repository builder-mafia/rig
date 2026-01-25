'use client';

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
import type { ProviderId } from './ProviderConfigCommandView';

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', description: 'GPT-4o, GPT-4, GPT-3.5' },
  { id: 'google', name: 'Google AI', description: 'Gemini Pro, Gemini Flash' },
  { id: 'anthropic', name: 'Anthropic', description: 'Claude 3.5, Claude 3' },
] as const;

export function ProvidersCommandView() {
  const { isOpen } = useCommandDialogView('providers');
  const { navigate, close } = useCommandDialog();
  const [value, setValue] = React.useState('');

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      close();
      setValue('');
    }
  };

  const handleSelectProvider = (providerId: ProviderId) => {
    navigate('provider-config', { providerId });
  };

  if (!isOpen) return null;

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      value={value}
      onValueChange={setValue}
    >
      <CommandInput placeholder='Search providers...' />
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandList>
        <CommandGroup
          heading={
            <span className='text-blue-500 font-semibold'>Providers</span>
          }
        >
          {PROVIDERS.map(provider => (
            <CommandItem
              key={provider.id}
              onSelect={() => handleSelectProvider(provider.id)}
            >
              {getProviderIcon(provider.id, 'size-4')}
              <div className='flex flex-col'>
                <span>{provider.name}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
