import type { UIMessage } from 'ai';
import { noop } from 'es-toolkit';
import { useMemo } from 'react';
import { useChat } from '@/core/chat/useChat';
import { messagesToThreads } from '@/core/helper';
import { providerRegistry } from '@/core/provider/providerRegistry';
import { dbAtoms } from '@/idb/dbStore';
import { assertDefined } from '@/utils/assertDefined';
import { useSwrAtomValue } from '@/utils/useSwrAtomValue';
import { registerProvider } from '../helper/registerProvider';
import { ChatInput } from './ChatInput';
import { ChatList } from './ChatList';

export const Chatting = () => {
  const selectedChannel = useSwrAtomValue(dbAtoms.selectedChannelAtom);
  const config = useSwrAtomValue(dbAtoms.configAtom);
  const messages = useSwrAtomValue(dbAtoms.selectedChannelMessagesAtom);

  assertDefined(selectedChannel, 'Chatting: selectedChannel is not found.');
  assertDefined(config, 'Chatting: config is not found.');
  assertDefined(messages, 'Chatting: messages is not found.');

  registerProvider(config);

  const provider = useMemo(
    () => providerRegistry.get(selectedChannel.providerName),
    [selectedChannel.providerName],
  );

  assertDefined(provider, 'Chatting: provider is not found.');

  const modelId = useMemo(() => selectedChannel.model, [selectedChannel.model]);

  const { sendMessage, uiMessages, status } = useChat({
    id: selectedChannel.id,
    provider,
    modelId,
    messages,
    onData: noop,
    onFinish: noop,
    onError: noop,
  });

  const threads = useMemo(() => messagesToThreads(uiMessages), [uiMessages]);

  return (
    <>
      <ChatList threads={threads} status={status} />
      <ChatInput sendMessage={sendMessage as (message: UIMessage) => void} />
    </>
  );
};
