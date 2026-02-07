'use client';

import type { ProviderId } from '@allin/ai';
import { validateApiKey } from '@allin/ai';
import { Button, CommandDialog, CommandList, Input, toast } from '@allin/ui';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useCommandPalette } from '@/business/command-palette/useCommandPalette';
import { getProviderIcon } from '@/business/logo/ProviderIconMap';
import { useSaveApiKey } from '@/lib/gateway/useApiKeyQuery';

type ProviderConfigViewProps = {
  providerId: ProviderId;
};

const PROVIDER_INFO: Record<ProviderId, { name: string; placeholder: string }> =
  {
    openai: { name: 'OpenAI', placeholder: 'sk-...' },
    google: { name: 'Google AI', placeholder: 'AIza...' },
    anthropic: { name: 'Anthropic', placeholder: 'sk-ant-...' },
  };

export const ProviderConfigCommandView = ({
  providerId,
}: ProviderConfigViewProps) => {
  const { close } = useCommandPalette();
  const [apiKey, setApiKey] = useState('');
  const saveApiKey = useSaveApiKey();

  const info = providerId ? PROVIDER_INFO[providerId] : null;

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      close();
      setApiKey('');
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim() || saveApiKey.isPending || !providerId) return;

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

    saveApiKey.mutate(
      { providerName: providerId, apiKey: apiKey.trim() },
      {
        onSuccess: () => {
          toast.success('API key saved successfully', {
            position: 'top-center',
            duration: 3000,
          });
          close();
          setApiKey('');
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  if (!providerId || !info) return null;

  return (
    <CommandDialog open onOpenChange={handleOpenChange} showCloseButton={false}>
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
              disabled={saveApiKey.isPending}
            />
          </div>
          <div className='flex justify-end'>
            <Button
              size='sm'
              disabled={!apiKey.trim() || saveApiKey.isPending}
              className='gap-2'
              onClick={handleSave}
            >
              {saveApiKey.isPending ? (
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
};
