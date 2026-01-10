import type { ConfigSchema } from '@allin/db-schema';
import { useEffect, useMemo } from 'react';
import type { z } from 'zod/v3';
import { useSwrAtomValue } from '@/hooks/use-swr-atom-value';
import { useTextSelection } from '@/hooks/use-text-selection';
import { dbAtoms } from '@/idb/db-store';
import { assert } from '@/utils/assert';
import { registerProvider } from '../helper/register-provider';
import { TextSelectionFloatingButtonList } from './TextSelectionFloatingButtonList';
import { ThreadList } from './ThreadList';
import { messagesToThreads } from './thread-util';
import { useChat } from './useChat';

export const Chatting = () => {
  const channel = useSwrAtomValue(dbAtoms.selectedChannelAtom);
  const config = useSwrAtomValue(dbAtoms.configAtom);

  assert(channel, 'Chatting: channel is not found.');
  // Text selection hook
  const { selectedText, isTextSelected, selectionBoundingRect, containerRef } =
    useTextSelection();

  registerProvider(config as z.infer<typeof ConfigSchema>);

  const { uiMessages, status, setSystemPrompt, regenerate } = useChat(channel);

  // add system prompt to the chat
  useEffect(() => {
    const prompt =
      'answer in markdown format.' +
      '\n code block should not be the child of the list item.';
    setSystemPrompt(prompt);
  }, [setSystemPrompt]);

  const threads = useMemo(() => messagesToThreads(uiMessages), [uiMessages]);

  return (
    <>
      {/* scroll shadow to top of the container! */}
      <div className='w-full from-background via-background/80 to-background/50 -top-2 absolute h-8 shrink-0 bg-gradient-to-b blur-sm'></div>
      <div
        ref={containerRef}
        className={
          'bg-background grow justify-center flex max-h-dvh overflow-y-auto mb-[-36px] '
        }
      >
        <ThreadList threads={threads} status={status} regenerate={regenerate} />
      </div>
      <TextSelectionFloatingButtonList
        isOpen={isTextSelected}
        selectedText={selectedText}
        selectionBoundingRect={selectionBoundingRect}
      />
    </>
  );
};
