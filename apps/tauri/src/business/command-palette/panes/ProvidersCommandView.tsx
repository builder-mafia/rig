'use client';

import type { ProviderId } from '@allin/ai';
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
import { useApiKey } from '@/lib/gateway/api-key/useApiKeyQuery';
import { useCodexAuth } from '@/lib/gateway/codex-auth/useCodexAuth';

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', description: '' },
  { id: 'google', name: 'Google AI', description: '' },
  { id: 'anthropic', name: 'Anthropic', description: '' },
  {
    id: 'codex',
    name: 'Codex',
    description: 'ChatGPT Codex (Free with Pro/Plus)',
  },
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Vercel AI Gateway',
  },
] as const;

export const ProvidersCommandView = () => {
  const { navigate, close } = useCommandPalette();
  const [value, setValue] = useState('');
  const { apiKeyStatus } = useApiKey();
  const { isConnected: codexConnected } = useCodexAuth();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      close();
      setValue('');
    }
  };

  const handleSelectProvider = (providerId: ProviderId) => {
    navigate('provider-config', { providerId });
  };

  return (
    <CommandDialog
      open
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
              <div className='flex flex-1 items-center justify-between'>
                <span>{provider.name}</span>
                {(provider.id === 'codex'
                  ? codexConnected
                  : apiKeyStatus?.[provider.id]) && (
                  <span className='text-xs text-green-500 font-medium'>
                    Connected
                  </span>
                )}
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
