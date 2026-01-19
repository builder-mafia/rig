'use client';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@allin/ui';
import { CreditCard, Settings, User } from 'lucide-react';
import * as React from 'react';
import { validateApiKey } from '../validate-api-key/validate-api-key';
import { CommandItemProvider } from './provider/CommandItemProvider';
import { CommandProvider } from './provider/CommandProvider';
import {
  ProviderConfigForm,
  type ProviderId,
} from './provider/ProviderConfigForm';

type PageType = 'home' | 'providers' | 'provider-config';

export function CommandSetting() {
  const [open, setOpen] = React.useState(false);
  const [page, setPage] = React.useState<PageType>('home');
  const [value, setValue] = React.useState('');
  const [selectedProvider, setSelectedProvider] =
    React.useState<ProviderId | null>(null);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'j' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(open => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setPage('home');
      setValue('');
      setSelectedProvider(null);
    }
  };

  const handlePageChange = (newPage: PageType) => {
    setPage(newPage);
    setValue('');
  };

  const handleSelectProvider = (providerId: ProviderId) => {
    setSelectedProvider(providerId);
    handlePageChange('provider-config');
  };

  const isConfigPage = page === 'provider-config';

  return (
    <>
      <p className='text-muted-foreground text-sm'>
        Press{' '}
        <kbd className='bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none'>
          <span className='text-xs'>⌘</span>J
        </kbd>
      </p>
      <CommandDialog
        open={open}
        onOpenChange={handleOpenChange}
        showCloseButton={!isConfigPage}
        value={value}
        onValueChange={setValue}
      >
        {!isConfigPage && (
          <CommandInput
            placeholder={
              page === 'home'
                ? 'Type a command or search...'
                : 'Search providers...'
            }
          />
        )}
        <CommandList>
          {!isConfigPage && <CommandEmpty>No results found.</CommandEmpty>}

          {page === 'home' && (
            <>
              <CommandGroup
                heading={
                  <span className='text-blue-500 font-semibold'>Providers</span>
                }
              >
                <CommandItemProvider
                  onSelect={() => handlePageChange('providers')}
                />
              </CommandGroup>
              <CommandGroup heading='Settings'>
                <CommandItem>
                  <User />
                  <span>Profile</span>
                  <CommandShortcut>⌘P</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <CreditCard />
                  <span>Billing</span>
                  <CommandShortcut>⌘B</CommandShortcut>
                </CommandItem>
                <CommandItem>
                  <Settings />
                  <span>Settings</span>
                  <CommandShortcut>⌘S</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </>
          )}

          {page === 'providers' && (
            <CommandProvider
              onSelectProvider={providerId =>
                handleSelectProvider(providerId as ProviderId)
              }
            />
          )}

          {isConfigPage && selectedProvider && (
            <ProviderConfigForm
              providerId={selectedProvider}
              onSave={async apiKey => {
                return await validateApiKey({
                  apiKey,
                  providerName: selectedProvider,
                });
              }}
              onClose={() => handleOpenChange(false)}
            />
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
