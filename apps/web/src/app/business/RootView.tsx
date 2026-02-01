import type { UI } from '@allin/context';
import { motion } from 'motion/react';
import React, { Suspense, useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Subject } from 'rxjs';
import { ChatInput } from './chatting/ChatInput';
import { Chatting } from './chatting/Chatting';
import { ChattingSuspenseFallbackView } from './chatting/ChattingSuspenseFallbackView';
import { ExtensionDock } from './dock/ExtensionDock';
import { CenterHeader } from './header/CenterHeader';
import { ChannelListButton } from './header/ChannelListButton';
import { RightHeader } from './header/RightHeader';
import { Initializer } from './Initializer';

export const RootViewRenderComponent$ = new Subject<
  Parameters<UI['render']>[0] | null
>();

export const RootView = React.memo(() => {
  const [renderProps, setRenderProps] = useState<
    Parameters<UI['render']>[0] | null
  >(null);

  useEffect(() => {
    const subscription = RootViewRenderComponent$.subscribe(props => {
      setRenderProps(props);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className={'w-full h-full flex flex-row'}>
      <Initializer />
      <ExtensionDock />
      {!renderProps && (
        <motion.div
          // when left panel is open, the main chatting area should be animated.
          layout={'size'}
          className='flex-1 flex h-full w-full flex-col relative'
        >
          <Suspense fallback={<div>Loading...</div>}>
            <RightHeader />
          </Suspense>
          {/* need Suspense to prevent layout shift */}
          {/* if we don't use Suspense, promise is thrown to the root view and every UI components are flickering */}

          <div className='fixed top-2 left-2 flex z-20'>
            <Suspense fallback={<div />}>
              <ChannelListButton />
            </Suspense>
          </div>

          {/* <LeftPanelRenderer /> */}
          <CenterHeader />
          <Suspense fallback={<ChattingSuspenseFallbackView />}>
            <Chatting />
          </Suspense>
          <ErrorBoundary
            fallbackRender={({ error }) => (
              <div className='z-50 w-full'>
                ChatInput Error: {error.message}
              </div>
            )}
          >
            <Suspense fallback={<ChattingSuspenseFallbackView />}>
              <ChatInput />
            </Suspense>
          </ErrorBoundary>
        </motion.div>
      )}
      {renderProps && renderProps.component}
    </div>
  );
});

RootView.displayName = 'RootView';
