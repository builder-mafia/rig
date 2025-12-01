import type { ChatOnFinishCallback, UIMessage } from 'ai';
import { toMerged } from 'es-toolkit';
import { useSetAtom } from 'jotai';
import { useCallback, useMemo } from 'react';
import { useChat } from '@/core/chat/useChat';
import { messagesToThreads } from '@/core/helper';
import { providerRegistry } from '@/core/provider/providerRegistry';
import { useSwrAtomValue } from '@/hooks/use-swr-atom-value';
import { dbAtoms } from '@/idb/db-store';
import { assert } from '@/utils/assert';
import { registerProvider } from '../helper/register-provider';
import { ChatList } from './ChatList';

export const Chatting = () => {
  const selectedChannel = useSwrAtomValue(dbAtoms.selectedChannelAtom);
  const config = useSwrAtomValue(dbAtoms.configAtom);
  const messages = useSwrAtomValue(dbAtoms.selectedChannelMessagesAtom);
  const saveMessages = useSetAtom(dbAtoms.selectedChannelMessagesAtom);

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
      const dbMessage = toMerged(message, { channelId: selectedChannel.id });
      saveMessages([dbMessage]);
    },
    [selectedChannel.id, saveMessages],
  );

  const onFinish = useCallback<ChatOnFinishCallback<UIMessage>>(
    options => {
      // do not save message if the response is aborted, disconnected, or error.
      const shouldCancel =
        options.isAbort || options.isDisconnect || options.isError;
      if (shouldCancel) return;

      const dbMessage = toMerged(options.message, {
        channelId: selectedChannel.id,
      });
      saveMessages([dbMessage]);
    },
    [saveMessages, selectedChannel.id],
  );

  const { uiMessages, status } = useChat({
    id: selectedChannel.id,
    provider,
    modelId,
    messages,
    onBeforeSend,
    onFinish,
  });

  const threads = useMemo(() => messagesToThreads(uiMessages), [uiMessages]);

  return (
    <>
      <div
        className={
          'bg-background grow justify-center flex max-h-dvh overflow-y-auto mb-[-36px] '
        }
      >
        <ChatList threads={threads} status={status} />
      </div>
      {/* scroll shadow to top of the container */}
      <div className='w-full from-background via-background/80 to-background/50 -top-2 absolute h-8 shrink-0 bg-gradient-to-b blur-sm'></div>
    </>
  );
};
