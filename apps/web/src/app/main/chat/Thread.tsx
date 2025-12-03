import type { UIMessage, useChat } from '@ai-sdk/react';
import { useEffect, useRef } from 'react';
import { AssistantMessage } from '@/app/components/chatting/AssistantMessage';
import { UserMessage } from '@/app/components/chatting/UserMessage';
import { assert } from '@/utils/assert';

type ThreadProps = {
  thread: Array<UIMessage>;
  isLast: boolean;
  status: ReturnType<typeof useChat>['status'];
};

export const Thread = ({ thread, isLast }: ThreadProps) => {
  // thread length 1 : only user message (for some reason, ai response could not be generated)
  // thread length 2 : user message and assistant message
  assert(
    thread.length > 0 && thread.length <= 2,
    `Thread: thread length is not valid. thread length: ${thread.length}. thread: ${JSON.stringify(thread)}`,
  );

  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isLast) {
      ref.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [isLast]);

  const userMessage = thread.filter(message => message.role === 'user')[0];
  const assistantMessage: UIMessage | undefined = thread.filter(
    message => message.role === 'assistant',
  )[0];

  return (
    <>
      <UserMessage message={userMessage} />
      {assistantMessage && (
        <AssistantMessage
          key={assistantMessage.id}
          message={assistantMessage}
        ></AssistantMessage>
      )}
    </>
  );
};

// <article style={isLast ? { minHeight: 'calc(-264px + 100dvh)' } : {}}>
//           <Message
//             key={assistantMessages.id}
//             message={assistantMessages}
//           ></Message></article>
