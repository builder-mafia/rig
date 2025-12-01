import { useSetAtom } from 'jotai';
import { ChevronDown, KeyRound, MessageCirclePlus } from 'lucide-react';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { v4 } from 'uuid';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSwrAtomValue } from '@/hooks/use-swr-atom-value';
import { dbAtoms } from '@/idb/db-store';
import { assertDefined } from '@/utils/assert';
import { modalManager } from '../modal/modalManager';

export const RightHeader = () => {
  const selectedChannel = useSwrAtomValue(dbAtoms.selectedChannelAtom);
  const setConfig = useSetAtom(dbAtoms.configAtom);
  const createChannel = useSetAtom(dbAtoms.createChannelAtom);

  assertDefined(selectedChannel, 'RightHeader: selectedChannel is not found');

  const onClickNewChannel = useCallback(async () => {
    const channelId = v4();
    const createdAt = Date.now();
    const model = selectedChannel.model;
    const providerName = selectedChannel.providerName;

    try {
      const newChannelId = await createChannel({
        id: channelId,
        model: model,
        providerName: providerName,
        createdAt: createdAt,
        isEmpty: true,
      });

      await setConfig({
        lastSelectedChannelId: newChannelId,
      });
    } catch (error) {
      toast.error('Failed to create new channel.', {
        position: 'top-center',
        duration: 3000,
      });
      console.error(error);
      return;
    }
  }, [createChannel, selectedChannel, setConfig]);

  return (
    <div className='fixed px-1 top-2 right-4 flex rounded-2xl dark:bg-input/30 dark:border-input'>
      <Button
        variant={'ghost'}
        size={'icon'}
        className='rounded-full'
        onClick={onClickNewChannel}
      >
        <MessageCirclePlus />
      </Button>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant={'ghost'}
            size={'icon'}
            className='rounded-full'
            onClick={() => {}}
          >
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-56' align='start'>
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => modalManager.openModal('apiKeyConfig')}
            >
              <KeyRound />
              My API Key
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
