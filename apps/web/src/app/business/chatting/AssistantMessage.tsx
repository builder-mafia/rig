import type { useChat } from '@ai-sdk/react';
import { getAssistantMessageText } from '@allin/chat';
import type { UIMessageMetadata } from '@allin/message-metadata-schema';
import { Spinner } from '@allin/ui';
import { AssertionError } from '@allin/utils';
import type { UIMessage } from 'ai';
import { assert } from 'es-toolkit';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { cn } from '@/utils/cn';
import { AssistantMessageErrorUI } from './AssistantMessageErrorUI';
import { Markdown } from './Markdown';

type AssistantMessageProps = {
  message: UIMessage<UIMessageMetadata>;
  isLast: boolean;
  status: ReturnType<typeof useChat>['status'];
  regenerate: (messageId: string) => void;
};

export const AssistantMessage = ({
  message,
  isLast,
  status,
  regenerate,
}: AssistantMessageProps) => {
  assert(
    message.role === 'assistant',
    new AssertionError(
      `AssistantMessage: message is not a assistant message. message: ${JSON.stringify(message)}`,
    ),
  );

  const textMessage = getAssistantMessageText(message);
  const isAborted = message.metadata?.isAborted === true;
  const isGenerating = status === 'streaming' && !isAborted;
  const errorMessage = message.metadata?.errorMessage;
  const hasError = message.metadata?.isError === true || Boolean(errorMessage);
  const doRetry = useCallback(() => {
    regenerate(message.id);
    console.log('regenerate', message.id);
  }, [regenerate, message.id]);

  return (
    // override the default prose max-width to none.
    <article className='prose dark:prose-invert max-w-none relative'>
      <ErrorBoundary
        fallbackRender={({ error }) => <div>Error: {error.message}</div>}
      >
        <Markdown messageId={message.id} text={textMessage} />
      </ErrorBoundary>
      {isAborted && !hasError && (
        <p className='text-xs !m-0 text-yellow-500 opacity-75'>canceled</p>
      )}
      {hasError && (
        <AssistantMessageErrorUI
          errorMessage={
            errorMessage ?? 'Something went wrong. please try again.'
          }
          onRetry={doRetry}
          // only show retry button if the message is the last message
          // because if the message is not the last message,
          // message context could be contaminated by the previous message.
          showRetryButton={isLast}
        />
      )}
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
