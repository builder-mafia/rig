'use client';

import type { ProviderId } from '@allin/ai';
import { validateApiKey } from '@allin/ai';
import { Button, CommandDialog, CommandList, Input, toast } from '@allin/ui';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useCommandPalette } from '@/business/command-palette/useCommandPalette';
import { getProviderIcon } from '@/business/logo/ProviderIconMap';
import { useApiKey } from '@/lib/gateway/api-key/useApiKeyQuery';
import { useCodexAuth } from '@/lib/gateway/codex-auth/useCodexAuth';

type ProviderConfigViewProps = {
  providerId: ProviderId;
};

const PROVIDER_NAMES: Record<ProviderId, string> = {
  openai: 'OpenAI',
  google: 'Google AI',
  anthropic: 'Anthropic',
  codex: 'Codex',
};

const API_KEY_PLACEHOLDERS: Record<Exclude<ProviderId, 'codex'>, string> = {
  openai: 'sk-...',
  google: 'AIza...',
  anthropic: 'sk-ant-...',
};

export const ProviderConfigCommandView = ({
  providerId,
}: ProviderConfigViewProps) => {
  const { close } = useCommandPalette();
  const name = providerId ? PROVIDER_NAMES[providerId] : null;

  const handleOpenChange = (open: boolean) => {
    if (!open) close();
  };

  if (!providerId || !name) return null;

  return (
    <CommandDialog open onOpenChange={handleOpenChange} showCloseButton={false}>
      <CommandList>
        <div className='p-4 flex flex-col gap-4'>
          <div className='flex items-center gap-2'>
            {getProviderIcon(providerId, 'size-5')}
            <h3 className='font-semibold'>{name}</h3>
          </div>
          {providerId === 'codex' ? (
            <CodexOAuthSection onClose={close} />
          ) : (
            <ApiKeySection providerId={providerId} onClose={close} />
          )}
        </div>
      </CommandList>
    </CommandDialog>
  );
};

// -- Codex OAuth Section --

const CodexOAuthSection = ({ onClose }: { onClose: () => void }) => {
  const { authStatus, isConnected, startOAuth, revoke } = useCodexAuth();

  const handleLogin = () => {
    startOAuth.mutate(undefined, {
      onSuccess: () => {
        toast.success('Connected to ChatGPT', {
          position: 'top-center',
          duration: 3000,
        });
        onClose();
      },
      onError: e => {
        toast.error(`Login failed: ${e.message}`, {
          position: 'top-center',
          duration: 15000,
          closeButton: true,
        });
      },
    });
  };

  const handleRevoke = () => {
    revoke.mutate(undefined, {
      onSuccess: () => {
        toast.success('Disconnected from ChatGPT', {
          position: 'top-center',
          duration: 3000,
        });
      },
    });
  };

  const isPending = startOAuth.isPending;

  if (isConnected) {
    return (
      <>
        <div className='flex items-center gap-2'>
          <span className='size-2 rounded-full bg-green-500' />
          <span className='text-sm text-muted-foreground'>
            Connected
            {authStatus?.status === 'connected' &&
              authStatus.accountId &&
              ` (${authStatus.accountId})`}
          </span>
        </div>
        <div className='flex justify-end'>
          <Button
            size='sm'
            variant='destructive'
            onClick={handleRevoke}
            disabled={revoke.isPending}
          >
            {revoke.isPending ? (
              <Loader2 className='size-4 animate-spin' />
            ) : (
              'Disconnect'
            )}
          </Button>
        </div>
      </>
    );
  }

  if (authStatus?.status === 'expired') {
    return (
      <>
        <div className='flex items-center gap-2'>
          <span className='size-2 rounded-full bg-yellow-500' />
          <span className='text-sm text-muted-foreground'>Session expired</span>
        </div>
        <div className='flex justify-end'>
          <Button
            size='sm'
            onClick={handleLogin}
            disabled={isPending}
            className='gap-2'
          >
            {isPending ? (
              <Loader2 className='size-4 animate-spin' />
            ) : (
              'Reconnect'
            )}
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <p className='text-sm text-muted-foreground'>
        Login with your ChatGPT account to use Codex models for free.
      </p>
      <div className='flex justify-end'>
        <Button
          size='sm'
          onClick={handleLogin}
          disabled={isPending}
          className='gap-2'
        >
          {isPending ? (
            <Loader2 className='size-4 animate-spin' />
          ) : (
            'Login with ChatGPT'
          )}
        </Button>
      </div>
    </>
  );
};

// -- API Key Section (existing providers) --

const ApiKeySection = ({
  providerId,
  onClose,
}: {
  providerId: Exclude<ProviderId, 'codex'>;
  onClose: () => void;
}) => {
  const [apiKey, setApiKey] = useState('');
  const { saveApiKey } = useApiKey();

  const placeholder = API_KEY_PLACEHOLDERS[providerId];

  const handleSave = async () => {
    if (!apiKey.trim() || saveApiKey.isPending) return;

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
          onClose();
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

  return (
    <>
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
          placeholder={placeholder}
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
    </>
  );
};
