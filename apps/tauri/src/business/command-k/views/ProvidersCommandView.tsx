'use client';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@allin/ui';
import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';
import { getProviderIcon } from '@/business/logo/ProviderIconMap';
import { useCommandDialog } from '../useCommandDialogView';
import type { ProviderId } from './ProviderConfigCommandView';

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', description: 'GPT-4o, GPT-4, GPT-3.5' },
  { id: 'google', name: 'Google AI', description: 'Gemini Pro, Gemini Flash' },
  { id: 'anthropic', name: 'Anthropic', description: 'Claude 3.5, Claude 3' },
] as const;

type ConnectionStatus = Record<ProviderId, boolean>;

function useProviderConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>({
    openai: false,
    google: false,
    anthropic: false,
  });

  useEffect(() => {
    async function checkAll() {
      const results = await Promise.all(
        PROVIDERS.map(async prov => {
          try {
            const has = await invoke<boolean>('has_api_key', {
              providerName: prov.id,
            });
            return [prov.id, has] as const;
          } catch {
            return [prov.id, false] as const;
          }
        }),
      );

      setStatus(Object.fromEntries(results) as ConnectionStatus);
    }

    checkAll();
  }, []);

  return status;
}

export function ProvidersCommandView() {
  const { navigate, close } = useCommandDialog();
  const [value, setValue] = useState('');
  const connectionStatus = useProviderConnectionStatus();

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
                {connectionStatus[provider.id] && (
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
}
