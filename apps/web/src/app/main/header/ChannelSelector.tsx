import { useAtom, useAtomValue } from 'jotai';
import { ChevronDown, Pencil, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type ChannelSchema, DB } from '@/idb/db';
import { channelListRefreshAtom } from '../store/channelListStore';
import { currentChannelIdAtom } from '../store/currentChannelStore';
import { CreateChannelDialog } from './CreateChannelDialog';
import { EditChannelDialog } from './EditChannelDialog';

export const ChannelSelector = () => {
  const [currentChannelId, setCurrentChannelId] = useAtom(currentChannelIdAtom);
  const channelListRefresh = useAtomValue(channelListRefreshAtom);
  const [channels, setChannels] = useState<z.infer<typeof ChannelSchema>[]>([]);
  const [currentChannel, setCurrentChannel] = useState<
    z.infer<typeof ChannelSchema> | undefined
  >(undefined);
  const [isCreateChannelDialogOpen, setCreateChannelDialogOpen] =
    useState(false);
  const [isEditChannelDialogOpen, setEditChannelDialogOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<z.infer<
    typeof ChannelSchema
  > | null>(null);
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    DB.updateConfig({ lastSelectedChannelId: currentChannelId });
  }, [currentChannelId]);

  // Load channels from IDB (refreshes when channelListRefresh changes)
  useEffect(() => {
    const loadChannels = async () => {
      const allChannels = await DB.getChannels();
      setChannels(allChannels);
    };
    loadChannels();
  }, [channelListRefresh]);

  // Load current channel data
  useEffect(() => {
    const loadCurrentChannel = async () => {
      if (currentChannelId) {
        const channel = await DB.getChannel(currentChannelId);
        setCurrentChannel(channel);
      }
    };
    loadCurrentChannel();
  }, [currentChannelId, channelListRefresh]);

  const handleChannelSelect = (channelId: string) => {
    setCurrentChannelId(channelId);
  };

  const handleEditClick = (
    e: React.MouseEvent,
    channel: z.infer<typeof ChannelSchema>,
  ) => {
    e.stopPropagation();
    setSelectedChannel(channel);
    setEditChannelDialogOpen(true);
    setDropdownOpen(false);
  };

  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant='outline' className='gap-2'>
            {currentChannel?.name || '채널 선택'}
            <ChevronDown className='w-4 h-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='center' className='w-56 mr-4'>
          {channels.map(channel => (
            <DropdownMenuItem
              key={channel.id}
              onClick={() => handleChannelSelect(channel.id)}
              className={`flex justify-between items-center ${
                currentChannelId === channel.id ? 'bg-accent' : ''
              }`}
            >
              <span>{channel.name}</span>
              <Button
                variant='ghost'
                size='icon'
                className='h-6 w-6 hover:bg-gray-300 dark:hover:bg-gray-600'
                onClick={e => handleEditClick(e, channel)}
              >
                <Pencil className='w-4 h-4' />
              </Button>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setCreateChannelDialogOpen(true);
              setDropdownOpen(false);
            }}
          >
            <Plus className='w-4 h-4 mr-2' />
            채널 추가
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateChannelDialog
        open={isCreateChannelDialogOpen}
        onOpenChange={setCreateChannelDialogOpen}
      />
      <EditChannelDialog
        open={isEditChannelDialogOpen}
        onOpenChange={setEditChannelDialogOpen}
        channel={selectedChannel}
      />
    </>
  );
};
