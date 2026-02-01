'use client';

import { Button, CommandDialog, CommandList, Input, toast } from '@allin/ui';
import { invoke } from '@tauri-apps/api/core';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { getProviderIcon } from '@/business/logo/ProviderIconMap';
import { validateApiKey } from '@/business/validate-api-key/validate-api-key';
import {
  useCommandDialog,
  useCommandDialogView,
} from '../useCommandDialogView';

export type ProviderId = 'openai' | 'google' | 'anthropic';

type ProviderConfigViewProps = {
  providerId: ProviderId;
};

const PROVIDER_INFO: Record<ProviderId, { name: string; placeholder: string }> =
  {
    openai: {
      name: 'OpenAI',
      placeholder: 'sk-...',
    },
    google: {
      name: 'Google AI',
      placeholder: 'AIza...',
    },
    anthropic: {
      name: 'Anthropic',
      placeholder: 'sk-ant-...',
    },
  };

export function ProviderConfigCommandView() {
  const { isOpen, props } =
    useCommandDialogView<ProviderConfigViewProps>('provider-config');
  const { close } = useCommandDialog();
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const providerId = props?.providerId;
  const info = providerId ? PROVIDER_INFO[providerId] : null;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      close();
      setApiKey('');
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim() || isLoading || !providerId) return;

    setIsLoading(true);
    try {
      const isValid = await validateApiKey({
        apiKey: apiKey.trim(),
        providerName: providerId,
      });
      if (!isValid) {
        toast.error(
          'Invalid API key. Please check your key and try again. Your balance may be insufficient.',
          {
            position: 'top-center',
            duration: 15000,
            closeButton: true,
          },
        );
        return;
      }

      await invoke('save_api_key', { providerName: providerId, apiKey });
      toast.success('API key saved successfully', {
        position: 'top-center',
        duration: 3000,
      });
    } finally {
      close();
      setApiKey('');
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  if (!isOpen || !providerId || !info) return null;

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      showCloseButton={false}
    >
      <CommandList>
        <div className='p-4 flex flex-col gap-4'>
          <div className='flex items-center gap-2'>
            {getProviderIcon(providerId, 'size-5')}
            <h3 className='font-semibold'>{info.name}</h3>
          </div>
          <div className='flex flex-col gap-2'>
            <label htmlFor='apiKey' className='text-sm text-muted-foreground'>
              API Key
            </label>
            <Input
              id='apiKey'
              type='password'
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={info.placeholder}
              autoFocus
              disabled={isLoading}
            />
          </div>
          <div className='flex justify-end'>
            <Button
              size='sm'
              disabled={!apiKey.trim() || isLoading}
              className='gap-2'
              onClick={handleSave}
            >
              {isLoading ? (
                <Loader2 className='size-4 animate-spin' />
              ) : (
                <>
                  Save
                  <kbd className='bg-primary-foreground/20 pointer-events-none inline-flex h-5 items-center rounded px-1.5 font-mono text-[10px] font-medium'>
                    Enter
                  </kbd>
                </>
              )}
            </Button>
          </div>
        </div>
      </CommandList>
    </CommandDialog>
  );
}
