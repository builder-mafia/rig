'use client';

import { Kbd, toast } from '@allin/ui';
import { useCallback, useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import { EnergyBar } from './EnergyBar';
import { ChatInputView } from './input/ChatInputView';
import { AssistantMessage } from './message/AssistantMessage';
import { UserMessage } from './message/UserMessage';
import type { StorageChannel } from './storage/types';
import { useChannel } from './useChannel';
import { useChat } from './useChat';

export function ChattingView() {
  const {
    initialized,
    selectedChannel,
    createChannelWithMessage,
    error: channelError,
  } = useChannel();

  if (!initialized) {
    return <div className='p-4 text-muted-foreground'>Loading...</div>;
  }

  if (channelError) {
    return (
      <div className='p-4 text-red-600'>Error: {channelError.message}</div>
    );
  }

  if (!selectedChannel) {
    return <NewChatView onSubmit={createChannelWithMessage} />;
  }

  return <ChannelChatView channel={selectedChannel} />;
}

function NewChatView({
  onSubmit,
}: {
  onSubmit: (message: string) => Promise<StorageChannel>;
}) {
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (text: string) => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      await onSubmit(text);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className='h-dvh w-full flex flex-col bg-background'>
      <div className='flex-1 flex items-center justify-center'>
        <div className='text-center text-muted-foreground'>
          <p className='text-lg font-medium'>New Chat</p>
          <p className='text-sm'>Send a message to start a conversation</p>
        </div>
      </div>

      <div className='border-t bg-background/80 backdrop-blur px-4 py-3'>
        <div className='mx-auto max-w-3xl'>
          <ChatInputView
            disabled={isCreating}
            isStreaming={false}
            onStop={() => {}}
            onSubmitText={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}

function ChannelChatView({ channel }: { channel: StorageChannel }) {
  const { uiMessages, status, sendText, stop, isReady, error } =
    useChat(channel);
  const isStreaming = status === 'streaming' || status === 'submitted';

  const visibleMessages = useMemo(
    () => uiMessages.filter(m => m.role !== 'system'),
    [uiMessages],
  );

  // TODO: implement regenerate in useChat
  const regenerate = useCallback((_messageId: string) => {}, []);

  if (error) {
    return <div className='p-4 text-red-600'>Error: {error.message}</div>;
  }

  return (
    <div className='h-dvh w-full flex flex-col bg-background'>
      <div className='flex-1 overflow-y-auto px-4 py-6'>
        <div className='mx-auto max-w-3xl'>
          {visibleMessages.map((msg, index) =>
            match(msg.role)
              .with('user', () => <UserMessage key={msg.id} message={msg} />)
              .with('assistant', () => (
                <AssistantMessage
                  key={msg.id}
                  message={msg}
                  isLast={index === visibleMessages.length - 1}
                  status={status}
                  regenerate={regenerate}
                />
              ))
              .otherwise(() => null),
          )}
        </div>
      </div>

      <div className='border-t bg-background/80 backdrop-blur px-4 py-3'>
        <div className='mx-auto max-w-3xl flex flex-col gap-2'>
          <div className='flex items-center gap-2'>
            <div className='text-xs text-muted-foreground'>
              {isStreaming ? 'Streaming...' : 'Ready'}
            </div>
            <div className='w-36'>{isStreaming && <EnergyBar />}</div>
            {isStreaming && (
              <span className='flex items-center gap-1 text-xs'>
                <Kbd>esc</Kbd>
                <span className='text-muted-foreground/40'>stop</span>
              </span>
            )}
          </div>
          <ChatInputView
            disabled={!isReady || isStreaming}
            isStreaming={isStreaming}
            onStop={() => {
              stop();
              toast.warning('Message cancelled', {
                closeButton: true,
                position: 'top-right',
              });
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
