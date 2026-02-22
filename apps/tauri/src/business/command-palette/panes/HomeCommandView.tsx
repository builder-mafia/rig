'use client';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@allin/ui';
import { Bot, MessageSquare, Plug, Plus, User } from 'lucide-react';
import * as React from 'react';
import { useCommandPalette } from '@/business/command-palette/useCommandPalette';
import { useService } from '@/business/ServiceContext';

export function HomeCommandView() {
  const { channelManager } = useService();
  const { navigate, close } = useCommandPalette();

  const handleNewChat = () => {
    channelManager.clearSelectedChannel();
    close();
  };
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
      <CommandList className='max-h-[min(600px,80dvh)]'>
        <CommandGroup
          heading={<span className='text-blue-500 font-semibold'>Chat</span>}
        >
          <CommandItem onSelect={handleNewChat}>
            <Plus />
            <span>New Chat</span>
          </CommandItem>
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
        <CommandGroup
          heading={<span className='text-blue-500 font-semibold'>Agents</span>}
        >
          <CommandItem onSelect={() => navigate('agent-list')}>
            <User />
            <span>Manage Agents</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
