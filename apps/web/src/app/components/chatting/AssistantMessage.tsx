import type { UIMessage } from 'ai';
import { getAssistantMessageText } from '@/core/chat/message-util';
import { assert } from '@/utils/assert';
import { Markdown } from './Markdown';

type AssistantMessageProps = {
  message: UIMessage;
};

export const AssistantMessage = ({ message }: AssistantMessageProps) => {
  assert(
    message.role === 'assistant',
    `AssistantMessage: message is not a assistant message. message: ${JSON.stringify(message)}`,
  );

  const textMessage = getAssistantMessageText(message);

  return (
    // override the default prose max-width to none.
    <article className='prose dark:prose-invert max-w-none'>
      <Markdown messageId={message.id} text={textMessage} />
    </article>
  );
};
