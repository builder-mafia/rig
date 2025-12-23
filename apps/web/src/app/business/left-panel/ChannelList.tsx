import type { ChannelSchema } from '@allin/db-schema';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@allin/ui';
import { sortBy } from 'es-toolkit';
import { useSetAtom } from 'jotai';
import {
  InfoIcon,
  MoreHorizontal,
  Pencil,
  PinIcon,
  PinOffIcon,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod/v3';
import { useSwrAtomValue } from '@/hooks/use-swr-atom-value';
import { dbAtoms } from '@/idb/db-store';
import { assert } from '@/utils/assert';
import { channelTitleOpenStatus$ } from '../header/ChannelTitle';

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

// ghost channel is a no-meaning channel. they are empty(no messages) and have no title.
// if user create a new channel, the new channel is ghost channel until user set the title or send a message.
export const isGhostChannel = (channel: z.infer<typeof ChannelSchema>) => {
  return channel.isEmpty && !channel.title;
};

export const ChannelList = () => {
  const allChannels = useSwrAtomValue(dbAtoms.allChannelsAtom);
  const selectedChannel = useSwrAtomValue(dbAtoms.selectedChannelAtom);
  const updateSelectedChannelId = useSetAtom(
    dbAtoms.updateSelectedChannelIdAtom,
  );
  const deleteChannel = useSetAtom(dbAtoms.deleteChannelAtom);
  const deleteMessagesByChannelId = useSetAtom(
    dbAtoms.deleteMessagesByChannelIdAtom,
  );
  const updateChannel = useSetAtom(dbAtoms.updateChannelAtom);

  assert(allChannels, 'ChannelList: allChannels is not found.');
  assert(selectedChannel, 'ChannelList: selectedChannel is not found.');

  const onClick = async (channelId: string) => {
    if (selectedChannel.id === channelId) return;

    // delete previous channel if it is ghost channel
    const deletePrevChannel = isGhostChannel(selectedChannel);

    await updateSelectedChannelId(channelId);

    if (deletePrevChannel) {
      await deleteChannel(selectedChannel.id);
    }
  };

  const onDeleteChannel = async (channelId: string) => {
    // selected channel must always be exist. (that is, our business logic)
    // if the selected channel is the one to be deleted, select the next channel
    if (selectedChannel.id === channelId) {
      const remainingChannels = allChannels.filter(
        channel => channel.id !== channelId,
      );
      const nextChannel = sortBy(remainingChannels, [
        channel => -channel.updatedAt,
      ])[0];

      if (!nextChannel) {
        toast.error('Cannot delete the last channel', {
          position: 'top-center',
          duration: 3000,
        });
        return;
      }

      await updateSelectedChannelId(nextChannel.id);
    }

    await deleteChannel(channelId);
    await deleteMessagesByChannelId(channelId);
  };

  const onClickRename = () => {
    // dropdown menu click event closes the title input.
    // so we need to wait for the dropdown menu to be closed before opening the title input.
    setTimeout(() => {
      channelTitleOpenStatus$.next(true);
    }, 220);
  };

  const onClickPin = (channelId: string) => {
    const currentTime = Date.now();

    updateChannel(channelId, {
      pin: {
        order: currentTime,
        createdAt: currentTime,
      },
    });
  };

  const onClickUnpin = (channelId: string) => {
    updateChannel(channelId, {
      pin: undefined,
    });
  };

  const pinnedChannels = allChannels.filter(channel => Boolean(channel.pin));
  const unpinnedChannels = allChannels.filter(channel => !channel.pin);

  return (
    <>
      <SidebarHeader>
        <div className='w-full h-[24px]'></div>
      </SidebarHeader>
      <SidebarContent>
        {pinnedChannels.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className='select-none'>
              Pinned
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {pinnedChannels.map(channel => {
                return (
                  <SidebarMenuItem key={channel.id}>
                    <SidebarMenuButton
                      isActive={selectedChannel.id === channel.id}
                      onClick={() => onClick(channel.id)}
                    >
                      <span className='truncate'>
                        {channel.title ??
                          `Untitled ${formatDate(channel.createdAt)}`}
                      </span>
                    </SidebarMenuButton>
                    <DropdownMenu modal={true}>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuAction className='dark:hover:bg-white/20'>
                          <MoreHorizontal />
                        </SidebarMenuAction>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side='right' align='start'>
                        {selectedChannel.id === channel.id && (
                          <DropdownMenuItem onClick={onClickRename}>
                            <Pencil />
                            <span>Edit title</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => onClickUnpin(channel.id)}
                        >
                          <PinOffIcon />
                          <span>Unpin</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className='mb-1' />
                        <DropdownMenuItem>
                          <InfoIcon />
                          <span className='text-muted-foreground'>
                            Show information
                          </span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className='mb-1' />
                        <DropdownMenuItem
                          variant='destructive'
                          onClick={() => onDeleteChannel(channel.id)}
                        >
                          <Trash2 />
                          <span>Delete chat</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                );
              })}
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {unpinnedChannels.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>My Chats</SidebarGroupLabel>
            <SidebarGroupContent>
              {sortBy(unpinnedChannels, [channel => -channel.updatedAt]).map(
                channel => {
                  return (
                    <SidebarMenuItem key={channel.id}>
                      <SidebarMenuButton
                        isActive={selectedChannel.id === channel.id}
                        onClick={() => onClick(channel.id)}
                      >
                        <span className='truncate'>
                          {channel.title ??
                            `Untitled ${formatDate(channel.createdAt)}`}
                        </span>
                      </SidebarMenuButton>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuAction className='dark:hover:bg-white/20'>
                            <MoreHorizontal />
                          </SidebarMenuAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side='right' align='start'>
                          {selectedChannel.id === channel.id && (
                            <DropdownMenuItem onClick={onClickRename}>
                              <Pencil />
                              <span>Edit title</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => onClickPin(channel.id)}
                          >
                            <PinIcon />
                            <span>Pin</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className='mb-1' />
                          <DropdownMenuItem>
                            <InfoIcon />
                            <span className='text-muted-foreground'>
                              Show information
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className='mb-1' />
                          <DropdownMenuItem
                            variant='destructive'
                            onClick={() => onDeleteChannel(channel.id)}
                          >
                            <Trash2 />
                            <span>Delete chat</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  );
                },
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </>
  );
};
