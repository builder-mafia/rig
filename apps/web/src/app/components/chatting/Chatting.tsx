import type { UIMessage } from 'ai';
import { isEqual, noop } from 'es-toolkit';
import { getDefaultStore } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import { getProviderFromModel } from '@/core/chat/ai-model';
import { type ChatFacade, createChatFacade } from '@/core/chat/ChatFacade';
import { ChatFacadeManager } from '@/core/chat/ChatFacadeManager';
import { createTransport } from '@/core/chat/createTransport';
import { useChat } from '@/core/chat/useChat';
import { messagesToThreads } from '@/core/helper';
import { dbAtoms } from '@/idb/dbStore';
import { assertDefined } from '@/utils/assertDefined';
import { useSwrAtomValue } from '@/utils/useSwrAtomValue';
import { ChatInput } from './ChatInput';
import { ChatList } from './ChatList';

export const Chatting = () => {
  const selectedChannel = useSwrAtomValue(dbAtoms.selectedChannelAtom);
  const config = useSwrAtomValue(dbAtoms.configAtom);
  const messages = useSwrAtomValue(dbAtoms.selectedChannelMessagesAtom);

  assertDefined(selectedChannel, 'Chatting: selectedChannel is not found.');
  assertDefined(config, 'Chatting: config is not found.');
  assertDefined(messages, 'Chatting: messages is not found.');

  // when transport is changed, the chat facade's transport will be updated.
  // @see useChat.ts `shouldRecreateTransport`
  const transport = useMemo(() => {
    const { model } = selectedChannel;
    const { googleApiKey, openaiApiKey } = config;
    const provider = getProviderFromModel(model);
    return createTransport(
      provider === 'google' ? googleApiKey! : openaiApiKey!,
      provider,
      model,
    );
  }, [selectedChannel, config]);

  const { sendMessage, uiMessages, status } = useChat({
    id: selectedChannel.id,
    transport,
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
