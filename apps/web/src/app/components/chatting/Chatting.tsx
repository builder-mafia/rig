import type { ChatOnFinishCallback, UIMessage } from 'ai';
import { useSetAtom } from 'jotai';
import { useCallback, useEffect, useMemo } from 'react';
import { useChat } from '@/core/chat/useChat';
import { messagesToThreads } from '@/core/helper';
import { providerRegistry } from '@/core/provider/providerRegistry';
import { useSwrAtomValue } from '@/hooks/use-swr-atom-value';
import { dbAtoms } from '@/idb/db-store';
import { assert } from '@/utils/assert';
import { registerProvider } from '../helper/register-provider';
import { ThreadList } from './ThreadList';

export const Chatting = () => {
  const selectedChannel = useSwrAtomValue(dbAtoms.selectedChannelAtom);
  const config = useSwrAtomValue(dbAtoms.configAtom);
  const messages = useSwrAtomValue(dbAtoms.selectedChannelMessagesAtom);
  const addMessage = useSetAtom(dbAtoms.addMessageAtom);

  assert(selectedChannel, 'Chatting: selectedChannel is not found.');
  assert(config, 'Chatting: config is not found.');
  assert(messages, 'Chatting: messages is not found.');

  registerProvider(config);

  const provider = useMemo(
    () => providerRegistry.get(selectedChannel.providerName),
    [selectedChannel.providerName],
  );
  assert(provider, 'Chatting: provider is not found.');
  const modelId = useMemo(() => selectedChannel.model, [selectedChannel.model]);

  const onBeforeSend = useCallback(
    (message: UIMessage) => {
      addMessage(selectedChannel.id, message);
    },
    [selectedChannel.id, addMessage],
  );

  const onFinish = useCallback<ChatOnFinishCallback<UIMessage>>(
    options => {
      // do not save message if the response is aborted, disconnected, or error.
      const shouldCancel =
        options.isAbort || options.isDisconnect || options.isError;
      if (shouldCancel) return;

      addMessage(selectedChannel.id, options.message);
    },
    [selectedChannel.id, addMessage],
  );

  const { uiMessages, status, addPrompt } = useChat({
    id: selectedChannel.id,
    provider,
    modelId,
    messages,
    onBeforeSend,
    onFinish,
  });

  useEffect(() => {
    const prompt =
      'answer in markdown format.' +
      '\n code block should not be the child of the list item.';
    addPrompt(prompt);
  }, [selectedChannel.id, addPrompt]);

  const threads = useMemo(() => messagesToThreads(uiMessages), [uiMessages]);

  return (
    <>
      <div
        className={
          'bg-background grow justify-center flex max-h-dvh overflow-y-auto mb-[-36px] '
        }
      >
        <ThreadList threads={threads} status={status} />
      </div>
      {/* scroll shadow to top of the container */}
      <div className='w-full from-background via-background/80 to-background/50 -top-2 absolute h-8 shrink-0 bg-gradient-to-b blur-sm'></div>
    </>
  );
};
