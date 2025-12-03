import type { UIMessage } from 'ai';
import { Badge } from '@/components/ui/badge';
import { assert } from '@/utils/assert';

type UserMessageProps = {
  message: UIMessage;
};

const getUserMessage = (message: UIMessage): string => {
  return message.parts.reduce((acc, part) => {
    if (part.type === 'text') {
      return acc + part.text;
    }
    return acc;
  }, '');
};

export const UserMessage = ({ message }: UserMessageProps) => {
  assert(message.role === 'user', 'UserMessage: message is not a user message');

  const userMessage: string = getUserMessage(message);

  return (
    <div className='not-prose flex flex-col my-4 ml-auto max-w-[80%]'>
      <Badge className='text-sm p-1.5 px-2 rounded-xl text-wrap whitespace-pre-wrap break-keep'>
        {userMessage}
      </Badge>
    </div>
  );
};
