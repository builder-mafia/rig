'use client';

import { getAssistantMessageText, getUserMessageText } from '@allin/ai';
import { useMemo } from 'react';
import { ChatInputView } from '@/business/chat/ChatInputView';
import { EnergyBar } from './EnergyBar';
import type { StorageChannel } from './storage/types';
import { useChannelState } from './useChannelState';
import { useChat } from './useChat';

export function ChattingView() {
  const {
    initialized,
    selectedChannel,
    error: channelError,
  } = useChannelState();

  if (!initialized) {
    return <div className='p-4 text-muted-foreground'>Loading...</div>;
  }

  if (channelError) {
    return (
      <div className='p-4 text-red-600'>Error: {channelError.message}</div>
    );
  }

  if (!selectedChannel) {
    return <div className='p-4 text-muted-foreground'>No channel found</div>;
  }

  return <ChannelChatView channel={selectedChannel} />;
}

function ChannelChatView({ channel }: { channel: StorageChannel }) {
  const { uiMessages, status, sendText, stop, isReady, error } =
    useChat(channel);
  const isStreaming = status === 'streaming' || status === 'submitted';

  const visibleMessages = useMemo(
    () => uiMessages.filter(m => m.role !== 'system'),
    [uiMessages],
  );

  const renderedMessages = useMemo(
    () =>
      visibleMessages.map(msg => {
        const isUser = msg.role === 'user';
        const text = isUser
          ? getUserMessageText(msg)
          : getAssistantMessageText(msg);

        return (
          <div
            key={msg.id}
            className={
              isUser
                ? 'ml-auto max-w-[85%] rounded-2xl bg-primary text-primary-foreground px-4 py-3 whitespace-pre-wrap'
                : 'mr-auto max-w-[85%] rounded-2xl bg-muted px-4 py-3 whitespace-pre-wrap'
            }
          >
            {text || <span className='opacity-60'>(empty)</span>}
          </div>
        );
      }),
    [visibleMessages],
  );

  if (error) {
    return <div className='p-4 text-red-600'>Error: {error.message}</div>;
  }

  return (
    <div className='h-dvh w-full flex flex-col bg-background'>
      <div className='flex-1 overflow-y-auto px-4 py-6'>
        <div className='mx-auto max-w-3xl flex flex-col gap-4'>
          {renderedMessages}
        </div>
      </div>

      <div className='border-t bg-background/80 backdrop-blur px-4 py-3'>
        <div className='mx-auto max-w-3xl flex flex-col gap-2'>
          <div className='flex items-center gap-2'>
            <div className='text-xs text-muted-foreground'>
              {isStreaming ? 'Streaming...' : 'Ready'}
            </div>
            <div className='w-36'>
              <EnergyBar isActive={isStreaming} />
            </div>
          </div>
          <ChatInputView
            disabled={!isReady || isStreaming}
            isStreaming={isStreaming}
            onStop={() => {
              stop();
            }}
            onSubmitText={async text => {
              await sendText(text);
            }}
          />
        </div>
      </div>
    </div>
  );
}
