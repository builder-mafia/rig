import { motion } from 'motion/react';
import React, { Suspense } from 'react';
import { cn } from '@/lib/utils';
import { ChatInput } from './chatting/ChatInput';
import { Chatting } from './chatting/Chatting';
import { LeftHeader } from './header/LeftHeader';
import { RightHeader } from './header/RightHeader';
import { SidebarRenderer } from './sidebar/SidebarRenderer';

export const RootView = React.memo(() => {
  return (
    <div className={'w-full h-full flex flex-row'}>
      <LeftHeader />
      <Suspense fallback={<div>Loading...</div>}>
        <RightHeader />
      </Suspense>
      <SidebarRenderer />
      <motion.div
        id='thread-list-container'
        // when left panel is open, the main chatting area should be animated.
        layout={'size'}
        className='flex-1 flex h-full w-full flex-col'
      >
        <div
          className={
            'bg-background grow justify-center flex max-h-dvh overflow-y-auto mb-[-36px]'
          }
        >
          <Chatting />
        </div>
        <div
          id='thread-bottom-container'
          className='relative flex flex-col isolate z-10 w-full mx-auto'
        >
          <ChatInput />
        </div>
      </motion.div>
    </div>
  );
});

RootView.displayName = 'RootView';
