import { getUserMessageText } from '@allin/chat';
import type { UIMessageMetadata } from '@allin/message-metadata-schema';
import { Badge } from '@allin/ui';
import { AssertionError } from '@allin/utils';
import type { UIMessage } from 'ai';
import { assert } from 'es-toolkit';

type UserMessageProps = {
  message: UIMessage<UIMessageMetadata>;
};

export const UserMessage = ({ message }: UserMessageProps) => {
  assert(
    message.role === 'user',
    new AssertionError('UserMessage: message is not a user message'),
  );

  const userMessage: string = getUserMessageText(message);

  return (
    <div className='not-prose flex flex-col my-4 ml-auto max-w-[80%]'>
      <Badge className='text-sm p-1.5 px-2 rounded-xl text-wrap whitespace-pre-wrap break-keep'>
        {userMessage}
      </Badge>
    </div>
  );
};
