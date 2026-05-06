'use client';

import { Kbd, ScrollArea, toast } from '@allin/ui';
import { Bot, Sparkles } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { match } from 'ts-pattern';
import { EnergyBar } from '@/business/chatting/EnergyBar';
import { useChatFacadeCreation } from '@/business/chatting/facade/useChatFacade';
import { usePendingMessageProcess } from '@/business/chatting/hooks/usePendingMessageProcess';
import { useSaveUserMessage } from '@/business/chatting/hooks/useSaveUserMessage';
import { useSyncTransport } from '@/business/chatting/hooks/useSyncTransport';
import { ChatInputView } from '@/business/chatting/input/ChatInputView';
import { AssistantMessage } from '@/business/chatting/message-ui/AssistantMessage';
import { UserMessage } from '@/business/chatting/message-ui/UserMessage';
import { useChat } from '@/business/chatting/useChat';
import type { StorageChannel } from '@/lib/gateway/channel/types';

type AIPanelProps = {
  channel: StorageChannel;
};

export const AIPanel = ({ channel }: AIPanelProps) => {
  const { chatFacade } = useChatFacadeCreation(channel);

  usePendingMessageProcess(chatFacade);
  useSyncTransport(chatFacade);
  useSaveUserMessage(chatFacade);

  const { uiMessages, status, sendText, stop } = useChat(chatFacade);
  const isStreaming = status === 'streaming' || status === 'submitted';
  const visibleMessages = useMemo(
    () => uiMessages.filter(message => message.role !== 'system'),
    [uiMessages],
  );

  console.log('uiMessages', uiMessages);
  // TODO: implement regenerate in useChat.
  const regenerate = useCallback((_messageId: string) => {}, []);

  return (
    <div className='flex h-full min-h-0 flex-col bg-background'>
      <div className='flex h-11 shrink-0 items-center gap-2 border-b px-3'>
        <Sparkles className='size-4 text-blue-500' />
        <span className='text-sm font-semibold'>AI edit</span>
        <span className='ml-auto text-[11px] text-muted-foreground'>mock</span>
      </div>
      <ScrollArea className='min-h-0 flex-1'>
        <div className='flex flex-col gap-3 p-3 pb-4'>
          {visibleMessages.length === 0 ? (
            <EmptyConversationView />
          ) : (
            visibleMessages.map((message, index) =>
              match(message.role)
                .with('user', () => (
                  <UserMessage key={message.id} message={message} />
                ))
                .with('assistant', () => (
                  <AssistantMessage
                    key={message.id}
                    message={message}
                    isLast={index === visibleMessages.length - 1}
                    status={status}
                    regenerate={regenerate}
                  />
                ))
                .otherwise(() => null),
            )
          )}
          {isStreaming ? <WorkingMessageView /> : null}
        </div>
      </ScrollArea>
      <div className='shrink-0 border-t p-3'>
        <div className='mb-2 flex h-4 items-center gap-2'>
          <div className='w-24'>{isStreaming && <EnergyBar />}</div>
          {isStreaming ? (
            <span className='flex items-center gap-1 text-xs'>
              <Kbd>esc</Kbd>
              <span className='text-muted-foreground/40'>stop</span>
            </span>
          ) : null}
        </div>
        <ChatInputView
          disabled={isStreaming}
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
  );
};

const EmptyConversationView = () => {
  return (
    <div className='flex flex-col items-center justify-center gap-2 py-10 text-center'>
      <Sparkles className='size-5 text-muted-foreground' />
      <div className='text-xs text-muted-foreground'>
        Ask AI to refactor, translate, or fix this file.
      </div>
    </div>
  );
};

const WorkingMessageView = () => {
  return (
    <div className='flex items-start gap-2'>
      <div className='flex size-[22px] shrink-0 items-center justify-center rounded-md bg-foreground text-background'>
        <Bot className='size-3.5' />
      </div>
      <div className='flex h-[22px] items-center gap-1 px-1'>
        <span className='size-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:0ms]' />
        <span className='size-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:150ms]' />
        <span className='size-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:300ms]' />
      </div>
    </div>
  );
};
