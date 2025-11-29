import { useSetAtom } from 'jotai';
import {
  ChevronDown,
  KeyRound,
  MessageCirclePlus,
  Sidebar as SidebarIcon,
} from 'lucide-react';
import { motion } from 'motion/react';
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Chatting } from './chatting/Chatting';
import { ModalRegistry } from './modal/ModalRegistry';
import { modalManager } from './modal/modalManager';
import { SidebarRenderer } from './sidebar/SidebarRenderer';
import { sideBarAtoms } from './sidebar/sideBarStore';

export const RootView = React.memo(() => {
  const setIsSidebarOpen = useSetAtom(sideBarAtoms.isSidebarOpenAtom);

  return (
    <div className={cn('w-full h-full flex flex-row')}>
      <ModalRegistry />
      <div className='fixed top-1 left-2 flex '>
        <Button
          variant={'outline'}
          size={'icon'}
          onClick={() => setIsSidebarOpen(prev => !prev)}
        >
          <SidebarIcon />
        </Button>
      </div>
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
      <SidebarRenderer />
      <motion.div
        // when left panel is open, the main chatting area should be animated.
        layout={'size'}
        className='flex-1 h-full bg-background justify-center flex max-h-dvh'
      >
        <Chatting />
      </motion.div>
    </div>
  );
});

RootView.displayName = 'RootView';
