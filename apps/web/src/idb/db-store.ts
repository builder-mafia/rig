import { type AllinDbAdapter, createDbAtoms } from '@allin/db-atom';
import type { UIMessageMetadata } from '@allin/message-metadata-schema';
import type { UIMessage } from 'ai';
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

const dbAtoms = createDbAtoms(dbAdapter);

export { dbAtoms };
