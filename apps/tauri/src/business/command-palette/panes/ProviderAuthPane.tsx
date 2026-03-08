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
  vercel: 'Vercel',
};

const API_KEY_PLACEHOLDERS: Record<Exclude<ProviderId, 'codex'>, string> = {
  openai: 'sk-...',
  google: 'AIza...',
  anthropic: 'sk-ant-...',
  vercel: '...',
};

export const ProviderAuthPane = ({ providerId }: ProviderConfigViewProps) => {
  const { close } = useCommandPalette();
  const [isPending, setIsPending] = useState(false);
  const name = providerId ? PROVIDER_NAMES[providerId] : null;

  const handleOpenChange = (open: boolean) => {
    if (!open && !isPending) close();
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
            <CodexOAuthSection onClose={close} onPendingChange={setIsPending} />
          ) : (
            <ApiKeySection
              providerId={providerId}
              onClose={close}
              onPendingChange={setIsPending}
            />
          )}
        </div>
      </CommandList>
    </CommandDialog>
  );
};

// -- Codex OAuth Section --

const CodexOAuthSection = ({
  onClose,
  onPendingChange,
}: {
  onClose: () => void;
  onPendingChange: (pending: boolean) => void;
}) => {
  const { authStatus, isConnected, startOAuth, revoke } = useCodexAuth();

  const handleLogin = () => {
    onPendingChange(true);
    startOAuth.mutate(undefined, {
      onSuccess: () => {
        onPendingChange(false);
        toast.success('Connected to ChatGPT', {
          position: 'top-center',
          duration: 3000,
        });
        onClose();
      },
      onError: e => {
        onPendingChange(false);
        toast.error(`Login failed: ${e.message}`, {
          position: 'top-center',
          duration: 30000,
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
  onPendingChange,
}: {
  providerId: Exclude<ProviderId, 'codex'>;
  onClose: () => void;
  onPendingChange: (pending: boolean) => void;
}) => {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const { saveApiKey } = useApiKey();

  const isPending = isValidating || saveApiKey.isPending;
  const placeholder = API_KEY_PLACEHOLDERS[providerId];

  const handleSave = async () => {
    if (!apiKey.trim() || isPending) return;

    setIsValidating(true);
    onPendingChange(true);
    const { isValid, reason } = await validateApiKey({
      apiKey: apiKey.trim(),
      providerName: providerId,
    });
    console.log(isValid, reason);
    setIsValidating(false);
    onPendingChange(false);

    if (!isValid) {
      toast.error(
        `Invalid API key. Please check your key and try again. Your balance may be insufficient. details: ${reason}`,
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
          disabled={isPending}
        />
      </div>
      <div className='flex justify-end'>
        <Button
          size='sm'
          disabled={!apiKey.trim() || isPending}
          className='gap-2'
          onClick={handleSave}
        >
          {isPending ? (
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
