import { useSetAtom } from 'jotai';
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useSwrAtomValue } from '@/hooks/use-swr-atom-value';
import { dbAtoms } from '@/idb/db-store';
import { assert } from '@/utils/assert';

export const ChannelList = () => {
  const allChannels = useSwrAtomValue(dbAtoms.allChannelsAtom);
  const selectedChannelId = useSwrAtomValue(dbAtoms.selectedChannelIdAtom);
  const setSelectedChannelId = useSetAtom(dbAtoms.selectedChannelIdAtom);

  assert(allChannels, 'ChannelList: allChannels is not found.');
  assert(selectedChannelId, 'ChannelList: selectedChannel is not found.');

  const onClick = (channelId: string) => {
    setSelectedChannelId(channelId);
  };

  return (
    <>
      <SidebarHeader>
        <div className='w-full h-[24px]'></div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>My Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            {allChannels.map(channel => {
              return (
                <SidebarMenuItem key={channel.id}>
                  <SidebarMenuButton
                    isActive={selectedChannelId === channel.id}
                    onClick={() => onClick(channel.id)}
                  >
                    <span className='truncate'>
                      {channel.title ?? channel.id}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </>
  );
};
