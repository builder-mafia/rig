'use client';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@allin/ui';
import { MessageSquare, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useCommandPalette } from '@/business/command-palette/useCommandPalette';
import { useService } from '@/business/ServiceContext';

export const ChannelsCommandView = () => {
  const { channelManager } = useService();
  const { close } = useCommandPalette();
  const [value, setValue] = useState('');
  const allChannels = useMemo(() => {
    return channelManager.channels;
  }, [channelManager]);
  const channels_pinned = useMemo(
    () => allChannels.filter(c => c.pin),
    [allChannels],
  );
  const channels_normal = useMemo(
    () => allChannels.filter(c => !c.pin),
    [allChannels],
  );

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      close();
      setValue('');
    }
  };

  const handleSelectChannel = (channelId: string) => {
    channelManager.selectChannel(channelId);
    close();
  };

  const handleNewChat = () => {
    channelManager.clearSelectedChannel();
    close();
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <CommandDialog
      open
      onOpenChange={handleOpenChange}
      value={value}
      onValueChange={setValue}
    >
      <CommandInput placeholder='Search channels...' />
      <CommandEmpty>No channels found.</CommandEmpty>
      <CommandList>
        <CommandGroup>
          <CommandItem onSelect={handleNewChat}>
            <Plus className='size-4' />
            <span>New Chat</span>
          </CommandItem>
        </CommandGroup>

        {channels_pinned.length > 0 && (
          <CommandGroup
            heading={
              <span className='text-amber-500 font-semibold'>Pinned</span>
            }
          >
            {channels_pinned.map(channel => (
              <CommandItem
                key={channel.id}
                value={channel.id}
                onSelect={() => handleSelectChannel(channel.id)}
              >
                <MessageSquare className='size-4' />
                <div className='flex flex-1 items-center justify-between min-w-0'>
                  <span className='truncate'>
                    {channel.title || 'Untitled'}
                  </span>
                  <span className='text-xs text-muted-foreground ml-2 shrink-0'>
                    {formatDate(channel.updatedAt)}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {channels_normal.length > 0 && (
          <CommandGroup
            heading={
              <span className='text-blue-500 font-semibold'>Recent</span>
            }
          >
            {channels_normal.map(channel => (
              <CommandItem
                key={channel.id}
                value={channel.id}
                onSelect={() => handleSelectChannel(channel.id)}
              >
                <MessageSquare className='size-4' />
                <div className='flex flex-1 items-center justify-between min-w-0'>
                  <span className='truncate'>
                    {channel.title || 'Untitled'}
                  </span>
                  <span className='text-xs text-muted-foreground ml-2 shrink-0'>
                    {formatDate(channel.updatedAt)}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
};
