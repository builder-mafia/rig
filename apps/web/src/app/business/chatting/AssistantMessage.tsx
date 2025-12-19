import type { useChat } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import { AnimatePresence, motion } from 'motion/react';
import { Spinner } from '@allin/ui';
import { getAssistantMessageText } from '@/core/chat/message-util';
import { assert } from '@/utils/assert';
import { cn } from '@/utils/cn';
import { Markdown } from './Markdown';

type AssistantMessageProps = {
  message: UIMessage;
  isLast: boolean;
  status: ReturnType<typeof useChat>['status'];
};

export const AssistantMessage = ({
  message,
  isLast,
  status,
}: AssistantMessageProps) => {
  assert(
    message.role === 'assistant',
    `AssistantMessage: message is not a assistant message. message: ${JSON.stringify(message)}`,
  );

  const textMessage = getAssistantMessageText(message);
  const isGenerating = status === 'streaming';

  return (
    // override the default prose max-width to none.
    <article className='prose dark:prose-invert max-w-none relative'>
      <Markdown messageId={message.id} text={textMessage} />
      <AnimatePresence>
        {isLast && isGenerating && (
          <motion.div
            initial={{
              opacity: 0,
              filter: 'blur(2px)',
            }}
            animate={{
              opacity: 1,
              filter: 'blur(0px)',
            }}
            exit={{
              opacity: 0,
              filter: 'blur(2px)',
            }}
            transition={{
              duration: 0.17,
              ease: 'easeInOut',
            }}
            className={cn(
              'absolute flex items-center justify-center text-sm text-muted-foreground gap-1.5 w-full -top-6',
            )}
          >
            <Spinner size='xs' variant='default' className='opacity-50' />
            <p className='text-xs !m-0 text-muted-foreground opacity-75'>
              generating...
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
};
