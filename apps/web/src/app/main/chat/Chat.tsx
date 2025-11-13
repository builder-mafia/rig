import type { UIMessage } from '@ai-sdk/react';
import { useAtomValue } from 'jotai';
import { motion } from 'motion/react';
import { useEffect, useLayoutEffect, useState } from 'react';
import type { z } from 'zod';
import type { MessageMetadata } from '@/app/api/chat/messageMetadata';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChat } from '@/core/react/useChat';
import { type ChannelSchema, DB } from '@/idb/db';
import { cn } from '@/lib/utils';
import { generateUIMessage, messagesToThreads } from '../../../core/helper';
import { currentChannelIdAtom } from '../store/currentChannelStore';
import { getInitialPrompt } from './prompt';
import { Thread } from './Thread';
import { UserInput } from './UserInput';
export type MyMessage = UIMessage<MessageMetadata>;

export const Chat = () => {
  const currentChannelId = useAtomValue(currentChannelIdAtom);
  const [currentChannel, setCurrentChannel] = useState<
    z.infer<typeof ChannelSchema> | undefined
  >(undefined);

  const {
    uiMessages,
    sendMessage,
    setMessageContext,
    status,
    stop,
    setUiMessages,
  } = useChat<MyMessage>({
    id: currentChannelId,
    api: '/api/chat',
    experimental_throttle: 50,
    onBeforeSend: ({ message: userMessage }) => {
      DB.addMessage({ ...userMessage, channelId: currentChannelId });
    },
    onFinish: ({ message: assistantMessage }) => {
      DB.addMessage({ ...assistantMessage, channelId: currentChannelId });
    },
  });

  // Load current channel data
  useEffect(() => {
    const loadCurrentChannel = async () => {
      const channel = await DB.getChannel(currentChannelId);
      setCurrentChannel(channel);
    };
    loadCurrentChannel();
  }, [currentChannelId]);

  // Load messages for current channel
  useLayoutEffect(() => {
    DB.getMessagesByChannelId(currentChannelId).then(res => {
      setUiMessages(res);
    });
  }, [currentChannelId, setUiMessages]);

  // add initial prompt to the message context
  useEffect(() => {
    const prompt = currentChannel?.prompt || getInitialPrompt();
    setMessageContext(prev => [
      ...prev,
      generateUIMessage('system', prompt) as UIMessage<MessageMetadata>,
    ]);
  }, [currentChannel, setMessageContext]);

  const threads = messagesToThreads([...uiMessages]);

  return (
    <>
      {currentChannel && (
        <div className='w-full mb-4'>
          <h2 className='text-xl font-semibold text-gray-800'>
            {currentChannel.name}
          </h2>
          {currentChannel.description && (
            <p className='text-sm text-gray-500 mt-1'>
              {currentChannel.description}
            </p>
          )}
        </div>
      )}
      {threads.length > 0 && (
        <ScrollArea
          style={
            {
              '--data-streaming': status === 'streaming',
            } as React.CSSProperties
          }
          className='prose lg:px-6 max-w-none w-full max-h-[100%] h-0 min-h-0 grow mb-4 [&>div>div]:block! prose-p:my-4 prose-hr:my-4 prose-hr:invisible prose-headings:my-6 prose-li:my-1.5'
          scrollBarClassName='w-6 px-2 !-right-2'
        >
          <div className='p-4 gap-4 flex flex-col'>
            {threads.map((thread, index) => (
              <Thread
                key={`thread-${index}`}
                thread={thread}
                isLast={threads.length - 1 === index}
                status={status}
              ></Thread>
            ))}
          </div>
        </ScrollArea>
      )}
      <motion.div
        layout={'position'}
        className={cn('w-full flex flex-row gap-2 mt-[12px]')}
      >
        <UserInput status={status} stop={stop} sendMessage={sendMessage} />
      </motion.div>
    </>
  );
};
