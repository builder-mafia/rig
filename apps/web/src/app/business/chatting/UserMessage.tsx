import type { UIMessage } from 'ai';
import { Badge } from '@allin/ui';
import { getUserMessageText } from '@/core/chat/message-util';
import { assert } from '@/utils/assert';

type UserMessageProps = {
  message: UIMessage;
};

export const UserMessage = ({ message }: UserMessageProps) => {
  assert(message.role === 'user', 'UserMessage: message is not a user message');

  const userMessage: string = getUserMessageText(message);

  return (
    <div className='not-prose flex flex-col my-4 ml-auto max-w-[80%]'>
      <Badge className='text-sm p-1.5 px-2 rounded-xl text-wrap whitespace-pre-wrap break-keep'>
        {userMessage}
      </Badge>
    </div>
  );
};
