import type { ChannelSchema } from '@allin/db-schema';
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
} from '@allin/ui';
import { AssertionError } from '@allin/utils';
import { assert, sortBy } from 'es-toolkit';
import { useSetAtom } from 'jotai';
import { ListIcon, XIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import type { z } from 'zod/v3';
import { useSwrAtomValue } from '@/hooks/use-swr-atom-value';
import { dbAtoms } from '@/idb/db-store';

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isGhostChannel = (channel: z.infer<typeof ChannelSchema>) => {
  return channel.isEmpty && !channel.title;
};

export const ChannelListButton = () => {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const popoverRef = useRef<HTMLDivElement>(null);

  const allChannels = useSwrAtomValue(dbAtoms.allChannelsAtom);
  const selectedChannel = useSwrAtomValue(dbAtoms.selectedChannelAtom);
  const updateSelectedChannelId = useSetAtom(
    dbAtoms.updateSelectedChannelIdAtom,
  );
  const deleteChannel = useSetAtom(dbAtoms.deleteChannelAtom);

  assert(
    allChannels,
    new AssertionError('ChannelListButton: allChannels is not found.'),
  );
  assert(
    selectedChannel,
    new AssertionError('ChannelListButton: selectedChannel is not found.'),
  );

  const pinnedChannels = allChannels.filter(channel => Boolean(channel.pin));
  const unpinnedChannels = allChannels.filter(channel => !channel.pin);
  const sortedUnpinnedChannels = sortBy(unpinnedChannels, [
    channel => -channel.updatedAt,
  ]);

  // Flattened channel list for keyboard navigation
  const flatChannelList = useMemo(
    () => [...pinnedChannels, ...sortedUnpinnedChannels],
    [pinnedChannels, sortedUnpinnedChannels],
  );

  // Reset focused index when popover opens
  useEffect(() => {
    if (open) {
      const currentIndex = flatChannelList.findIndex(
        ch => ch.id === selectedChannel.id,
      );
      setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
    }
  }, [open, flatChannelList, selectedChannel.id]);

  const onSelectChannel = useCallback(
    async (channelId: string) => {
      if (selectedChannel.id === channelId) {
        setOpen(false);
        return;
      }

      const deletePrevChannel = isGhostChannel(selectedChannel);
      await updateSelectedChannelId(channelId);

      if (deletePrevChannel) {
        await deleteChannel(selectedChannel.id);
      }

      setOpen(false);
    },
    [selectedChannel, updateSelectedChannelId, deleteChannel],
  );

  // Arrow Up
  useHotkeys(
    'up',
    e => {
      e.preventDefault();
      setFocusedIndex(prev =>
        prev > 0 ? prev - 1 : flatChannelList.length - 1,
      );
    },
    { enabled: open, enableOnFormTags: true },
    [flatChannelList.length, open],
  );

  // Arrow Down
  useHotkeys(
    'down',
    e => {
      e.preventDefault();
      setFocusedIndex(prev =>
        prev < flatChannelList.length - 1 ? prev + 1 : 0,
      );
    },
    { enabled: open, enableOnFormTags: true },
    [flatChannelList.length, open],
  );

  // Enter to select
  useHotkeys(
    'enter',
    e => {
      e.preventDefault();
      const channel = flatChannelList[focusedIndex];
      if (channel) {
        onSelectChannel(channel.id);
      }
    },
    { enabled: open, enableOnFormTags: true },
    [focusedIndex, flatChannelList, onSelectChannel, open],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button className='rounded-full w-10' variant='outline' size='icon'>
          <ListIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        ref={popoverRef}
        align='start'
        sideOffset={8}
        className='w-72 p-0 border-0 duration-100 bg-popover/10'
      >
        <div className='relative backdrop-blur-md bg-white/70 dark:bg-black/20 border border-white/30 dark:border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden'>
          {/* Header */}
          <div className='flex items-center justify-between px-4 py-3 border-b border-white/20 dark:border-white/5'>
            <span className='text-sm font-medium text-gray-800 dark:text-gray-200'>
              Channels
            </span>
            <button
              type='button'
              onClick={() => setOpen(false)}
              className='p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors'
            >
              <XIcon className='w-4 h-4 text-gray-500 dark:text-gray-400' />
            </button>
          </div>
          {/* Channel List */}
          <ScrollArea className='h-[calc(100dvh-150px)]'>
            <div className='p-3'>
              {pinnedChannels.length > 0 && (
                <div className='mb-2'>
                  <div className='px-2 py-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide'>
                    Pinned
                  </div>
                  {pinnedChannels.map((channel, idx) => (
                    <ChannelItem
                      key={channel.id}
                      channel={channel}
                      isActive={selectedChannel.id === channel.id}
                      isFocused={focusedIndex === idx}
                      onSelect={onSelectChannel}
                    />
                  ))}
                </div>
              )}
              {sortedUnpinnedChannels.length > 0 && (
                <div>
                  <div className='px-1 py-1 text-xs font-bold text-gray-500 dark:text-gray-100 uppercase tracking-wide'>
                    My Chats
                  </div>
                  {sortedUnpinnedChannels.map((channel, idx) => (
                    <ChannelItem
                      key={channel.id}
                      channel={channel}
                      isActive={selectedChannel.id === channel.id}
                      isFocused={focusedIndex === pinnedChannels.length + idx}
                      onSelect={onSelectChannel}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
};

interface ChannelItemProps {
  channel: z.infer<typeof ChannelSchema>;
  isActive: boolean;
  isFocused: boolean;
  onSelect: (channelId: string) => void;
}

const ChannelItem = ({
  channel,
  isActive,
  isFocused,
  onSelect,
}: ChannelItemProps) => {
  const itemRef = useRef<HTMLButtonElement>(null);

  // Scroll into view when focused
  useEffect(() => {
    if (isFocused && itemRef.current) {
      itemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isFocused]);

  return (
    <button
      ref={itemRef}
      type='button'
      onClick={() => onSelect(channel.id)}
      className={`
        w-full text-left px-3 py-2 rounded-xl text-sm transition-all duration-100
        ${
          isActive
            ? 'bg-white/60 dark:bg-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] text-gray-900 dark:text-white font-medium'
            : 'text-gray-700 dark:text-gray-300'
        }
        ${
          isFocused && !isActive
            ? 'bg-white/40 dark:bg-white/10 ring-2 ring-blue-400/50 dark:ring-blue-500/50'
            : ''
        }
        ${
          isFocused && isActive
            ? 'ring-2 ring-blue-400/50 dark:ring-blue-500/50'
            : ''
        }
        ${!isFocused && !isActive ? 'hover:bg-white/40 dark:hover:bg-white/8' : ''}
      `}
    >
      <span className='block truncate'>
        {channel.title ?? `Untitled ${formatDate(channel.createdAt)}`}
      </span>
    </button>
  );
};
