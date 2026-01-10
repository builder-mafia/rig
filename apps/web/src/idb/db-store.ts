import { type AllinDbAdapter, createDbAtoms } from '@allin/db-atom';
import type { UIMessageMetadata } from '@allin/message-metadata-schema';
import type { UIMessage } from 'ai';
import { getDefaultStore } from 'jotai';
import { DB } from './db';

const dbAdapter = {
  getChannels: DB.getChannels,
  createChannel: DB.createChannel,
  updateChannel: DB.updateChannel,
  deleteChannel: DB.deleteChannel,
  getConfig: DB.getConfig,
  updateConfig: DB.updateConfig,
  getMessages: DB.getMessages,
  addMessage: async (
    channelId: string,
    message: UIMessage<UIMessageMetadata>,
  ) => {
    await DB.addMessage(channelId, message);
  },
  deleteMessage: async (messageId: string) => {
    await DB.deleteMessage(messageId);
  },
  deleteMessagesByChannelId: async (channelId: string) => {
    await DB.deleteMessagesByChannelId(channelId);
  },
} satisfies AllinDbAdapter;

export const dbAtoms = createDbAtoms(dbAdapter);

/**
 * get current model id and provider name.
 */
export const getConfig = async () => {
  const [selectedChannel, selectedChannelMessages] = await Promise.all([
    getDefaultStore().get(dbAtoms.selectedChannelAtom),
    getDefaultStore().get(dbAtoms.selectedChannelMessagesAtom),
  ]);

  if (!selectedChannel) {
    throw new Error('Selected channel is not found.');
  }

  return {
    messages: selectedChannelMessages,
    modelId: selectedChannel.model,
    provider: selectedChannel.providerName,
    prompt: selectedChannel.prompt,
    reasoningEffort: selectedChannel.reasoningEffort,
    reasoningSummary: selectedChannel.reasoningSummary,
  };
};

export const getSelectedChannelMessages = async () => {
  return await getDefaultStore().get(dbAtoms.selectedChannelMessagesAtom);
};
