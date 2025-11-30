import { motion } from 'motion/react';
import React from 'react';
import { cn } from '@/lib/utils';
import { Chatting } from './chatting/Chatting';
import { LeftHeader } from './header/LeftHeader';
import { RightHeader } from './header/RightHeader';
import { ModalRegistry } from './modal/ModalRegistry';
import { SidebarRenderer } from './sidebar/SidebarRenderer';

export const RootView = React.memo(() => {
  return (
    <div className={cn('w-full h-full flex flex-row')}>
      <ModalRegistry />
      <LeftHeader />
      <RightHeader />
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
