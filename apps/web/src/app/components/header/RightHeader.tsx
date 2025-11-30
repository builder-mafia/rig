import { ChevronDown, KeyRound, MessageCirclePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { modalManager } from '../modal/modalManager';

export const RightHeader = () => {
  return (
    <div className='fixed px-1 top-2 right-4 flex rounded-2xl dark:bg-input/30 dark:border-input'>
      <Button
        variant={'ghost'}
        size={'icon'}
        className='rounded-full'
        onClick={() => {}}
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
