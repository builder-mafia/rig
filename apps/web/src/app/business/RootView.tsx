import { motion } from 'motion/react';
import React, { Suspense } from 'react';
import { ChatInput } from './chatting/ChatInput';
import { Chatting } from './chatting/Chatting';
import { ChattingSuspenseFallbackView } from './chatting/ChattingSuspenseFallbackView';
import { CenterHeader } from './header/CenterHeader';
import { LeftHeader } from './header/LeftHeader';
import { RightHeader } from './header/RightHeader';
import { Initializer } from './Initializer';
import { LeftPanelRenderer } from './left-panel/LeftPanelRenderer';

export const RootView = React.memo(() => {
  return (
    <div className={'w-full h-full flex flex-row'}>
      <Initializer />
      <LeftHeader />
      <Suspense fallback={<div>Loading...</div>}>
        <RightHeader />
      </Suspense>
      <LeftPanelRenderer />
      <motion.div
        // when left panel is open, the main chatting area should be animated.
        layout={'size'}
        className='flex-1 flex h-full w-full flex-col relative'
      >
        <CenterHeader />
        <Suspense fallback={<ChattingSuspenseFallbackView />}>
          <Chatting />
        </Suspense>
        <Suspense fallback={<ChattingSuspenseFallbackView />}>
          <ChatInput />
        </Suspense>
      </motion.div>
    </div>
  );
});

RootView.displayName = 'RootView';
