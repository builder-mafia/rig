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
import {
  Bot,
  CreditCard,
  MessageSquare,
  Plug,
  Settings,
  User,
} from 'lucide-react';
import * as React from 'react';
import { useCommandDialog } from '../useCommandDialogView';

export function HomeCommandView() {
  const { navigate, close } = useCommandDialog();
  const [value, setValue] = React.useState('');

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      close();
      setValue('');
    }
  };

  return (
    <CommandDialog
      open
      onOpenChange={handleOpenChange}
      value={value}
      onValueChange={setValue}
    >
      <CommandInput placeholder='Type a command or search...' />
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandList>
        <CommandGroup
          heading={
            <span className='text-blue-500 font-semibold'>Channels</span>
          }
        >
          <CommandItem onSelect={() => navigate('channels')}>
            <MessageSquare />
            <span>Switch Channel</span>
          </CommandItem>
        </CommandGroup>
        <CommandGroup
          heading={
            <span className='text-blue-500 font-semibold'>Providers</span>
          }
        >
          <CommandItem onSelect={() => navigate('providers')}>
            <Plug />
            <span>Connect Provider</span>
          </CommandItem>
        </CommandGroup>
        <CommandGroup
          heading={<span className='text-blue-500 font-semibold'>Models</span>}
        >
          <CommandItem onSelect={() => navigate('model-select')}>
            <Bot />
            <span>Switch Model</span>
          </CommandItem>
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
      </CommandList>
    </CommandDialog>
  );
}
