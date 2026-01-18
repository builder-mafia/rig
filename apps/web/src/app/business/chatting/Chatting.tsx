import { AssertionError } from '@allin/utils';
import { assert } from 'es-toolkit';
import { useEffect, useMemo } from 'react';
import { useSwrAtomValue } from '@/hooks/use-swr-atom-value';
import { useTextSelection } from '@/hooks/use-text-selection';
import { dbAtoms } from '@/idb/db-store';
import { TextSelectionFloatingButtonList } from './TextSelectionFloatingButtonList';
import { ThreadList } from './ThreadList';
import { messagesToThreads } from './thread-util';
import { useChat } from './useChat';

export const Chatting = () => {
  const channel = useSwrAtomValue(dbAtoms.selectedChannelAtom);

  assert(channel, new AssertionError('Chatting: channel is not found.'));

  const { selectedText, isTextSelected, selectionBoundingRect, containerRef } =
    useTextSelection();

  const { uiMessages, status, setSystemPrompt, regenerate } = useChat(channel);

  useEffect(() => {
    const prompt =
      'answer in markdown format.' +
      '\n code block should not be the child of the list item.';
    setSystemPrompt(prompt);
  }, [setSystemPrompt]);

  const threads = useMemo(() => messagesToThreads(uiMessages), [uiMessages]);

  return (
    <>
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
