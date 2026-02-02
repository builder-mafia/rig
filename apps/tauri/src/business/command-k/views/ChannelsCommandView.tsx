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
import * as React from 'react';
import { ChannelState } from '@/business/chatting/ChannelState';
import {
  useCommandDialog,
  useCommandDialogView,
} from '../useCommandDialogView';

function useChannelList(isOpen: boolean) {
  const [channels, setChannels] = React.useState(
    ChannelState.getInstance().getSortedChannels(),
  );

  React.useEffect(() => {
    if (!isOpen) return;

    const subscription = ChannelState.getInstance()
      .getChannels$()
      .subscribe(() => {
        setChannels(ChannelState.getInstance().getSortedChannels());
      });

    return () => subscription.unsubscribe();
  }, [isOpen]);

  return channels;
}

export function ChannelsCommandView() {
  const { isOpen } = useCommandDialogView('channels');
  const { close } = useCommandDialog();
  const [value, setValue] = React.useState('');
  const { pinned, unpinned } = useChannelList(isOpen);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      close();
      setValue('');
    }
  };

  const handleSelectChannel = (channelId: string) => {
    ChannelState.getInstance().selectChannel(channelId);
    close();
  };

  const handleNewChat = () => {
    ChannelState.getInstance().clearSelection();
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

  if (!isOpen) return null;

  return (
    <CommandDialog
      open={isOpen}
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

        {pinned.length > 0 && (
          <CommandGroup
            heading={
              <span className='text-amber-500 font-semibold'>Pinned</span>
            }
          >
            {pinned.map(channel => (
              <CommandItem
                key={channel.id}
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

        {unpinned.length > 0 && (
          <CommandGroup
            heading={
              <span className='text-blue-500 font-semibold'>Recent</span>
            }
          >
            {unpinned.map(channel => (
              <CommandItem
                key={channel.id}
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
}
