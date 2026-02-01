'use client';

import type { UIMessageMetadata } from '@allin/message-metadata-schema';
import { Button, Textarea } from '@allin/ui';
import type { UIMessage } from 'ai';
import { useMemo, useState } from 'react';
import { useChat } from './useChat';
import { useDefaultChannel } from './useDefaultChannel';

function messageToText(message: UIMessage<UIMessageMetadata>) {
  const parts = message.parts as unknown[];
  const texts: string[] = [];

  for (const part of parts) {
    if (!part) continue;
    if (typeof part === 'string') {
      texts.push(part);
      continue;
    }

    if (typeof part === 'object') {
      const maybeText = (part as any).text;
      if (typeof maybeText === 'string') {
        texts.push(maybeText);
        continue;
      }

      const maybeContent = (part as any).content;
      if (typeof maybeContent === 'string') {
        texts.push(maybeContent);
      }
    }
  }

  return texts.join('');
}

export function ChattingView() {
  const { channel, error: channelError } = useDefaultChannel();
  const { uiMessages, status, sendText, stop, isReady, error } =
    useChat(channel);
  const [input, setInput] = useState('');
  const isStreaming = status === 'streaming' || status === 'submitted';

  const visibleMessages = useMemo(
    () => uiMessages.filter(m => m.role !== 'system'),
    [uiMessages],
  );

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !isReady) return;

    setInput('');
    await sendText(text);
  };

  if (channelError) {
    return (
      <div className='p-4 text-red-600'>Error: {channelError.message}</div>
    );
  }

  if (error) {
    return <div className='p-4 text-red-600'>Error: {error.message}</div>;
  }

  if (!channel) {
    return <div className='p-4 text-muted-foreground'>Loading...</div>;
  }

  return (
    <div className='h-dvh w-full flex flex-col bg-background'>
      <div className='flex-1 overflow-y-auto px-4 py-6'>
        <div className='mx-auto max-w-3xl flex flex-col gap-4'>
          {visibleMessages.map(msg => {
            const text = messageToText(msg);
            const isUser = msg.role === 'user';

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
          })}
        </div>
      </div>

      <div className='border-t bg-background/80 backdrop-blur px-4 py-3'>
        <div className='mx-auto max-w-3xl flex flex-col gap-2'>
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder='Ask AI anything...'
            className='min-h-12 max-h-56'
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSend().catch(err => {
                  console.error('send failed:', err);
                });
              }
            }}
          />

          <div className='flex items-center justify-between'>
            <div className='text-xs text-muted-foreground'>
              {isStreaming ? 'Streaming...' : 'Ready'}
            </div>

            <div className='flex gap-2'>
              {isStreaming && (
                <Button variant='outline' size='sm' onClick={stop}>
                  Stop
                </Button>
              )}
              <Button
                size='sm'
                onClick={() => {
                  handleSend().catch(err => console.error('send failed:', err));
                }}
                disabled={!input.trim() || !isReady || isStreaming}
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
