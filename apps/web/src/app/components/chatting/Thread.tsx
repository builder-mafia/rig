import type { useChat } from '@ai-sdk/react';
import { useEffect, useRef } from 'react';
import { AssistantMessage } from '@/app/components/chatting/AssistantMessage';
import type { Thread as ThreadType } from '@/app/components/chatting/thread-util';
import { UserMessage } from '@/app/components/chatting/UserMessage';

type ThreadProps = {
  thread: ThreadType;
  isLast: boolean;
  status: ReturnType<typeof useChat>['status'];
};

export const Thread = ({ thread, isLast, status }: ThreadProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLast) {
      ref.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [isLast]);

  return (
    <div
      ref={ref}
      className='flex flex-col gap-4 [&:last-child]:min-h-[calc(-180px+100dvh)] [&:last-child]:mb-10'
    >
      <UserMessage message={thread.userMessage} />
      {thread.assistantMessage && (
        <AssistantMessage
          key={thread.assistantMessage.id}
          message={thread.assistantMessage}
          isLast={isLast}
          status={status}
        ></AssistantMessage>
      )}
    </div>
  );
};
