import type { useChat } from '@ai-sdk/react';
import { useEffect, useRef } from 'react';
import { AssistantMessage } from '@/app/business/chatting/AssistantMessage';
import type { Thread as ThreadType } from '@/app/business/chatting/thread-util';
import { UserMessage } from '@/app/business/chatting/UserMessage';

type ThreadProps = {
  thread: ThreadType;
  isLast: boolean;
  status: ReturnType<typeof useChat>['status'];
  regenerate: (messageId: string) => void;
};

export const Thread = ({ thread, isLast, status, regenerate }: ThreadProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLast) {
      ref.current?.scrollIntoView({
        behavior: 'auto',
        block: 'start',
      });
    }
  }, [isLast]);

  return (
    <div
      ref={ref}
      className='flex flex-col gap-4 [&:last-child]:min-h-[calc(-180px+100dvh)] [&:last-child]:mb-16'
    >
      <UserMessage message={thread.userMessage} />
      {thread.assistantMessage && (
        <AssistantMessage
          key={thread.assistantMessage.id}
          message={thread.assistantMessage}
          isLast={isLast}
          status={status}
          regenerate={regenerate}
        ></AssistantMessage>
      )}
    </div>
  );
};
