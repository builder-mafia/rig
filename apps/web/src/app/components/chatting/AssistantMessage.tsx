import type { UIMessage } from 'ai';
import { assert } from '@/utils/assert';
import { Markdown } from './Markdown';

type AssistantMessageProps = {
  message: UIMessage;
};

const getTextAssistantMessage = (message: UIMessage): string => {
  return message.parts.reduce((acc, part) => {
    if (part.type === 'text') {
      return acc + part.text;
    }
    return acc;
  }, '');
};

export const AssistantMessage = ({ message }: AssistantMessageProps) => {
  assert(
    message.role === 'assistant',
    `AssistantMessage: message is not a assistant message. message: ${JSON.stringify(message)}`,
  );

  const textMessage = getTextAssistantMessage(message);

  return (
    // override the default prose max-width to none.
    <article className='prose dark:prose-invert max-w-none'>
      <Markdown messageId={message.id} text={textMessage} />
    </article>
  );
};
