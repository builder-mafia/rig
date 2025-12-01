import type { UIMessage } from 'ai';
import { MemoizedUserMessage } from '@/app/main/chat/memoized-user-message';
import { assert } from '@/utils/assert';

type UserMessageProps = {
  message: UIMessage;
};

export const UserMessage = ({ message }: UserMessageProps) => {
  assert(message.role === 'user', 'UserMessage: message is not a user message');

  return (
    <div ref={ref} className='not-prose flex flex-col my-4 ml-auto max-w-[80%]'>
      <Badge className='text-sm p-1.5 px-2 rounded-xl text-wrap whitespace-pre-wrap break-keep'>
        {content}
      </Badge>
    </div>
  );
};
