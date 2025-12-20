import { AllModelIdsSchema, LLMProviderNameSchema } from '@allin/chat';
import { type AllinDbAdapter, createDbAtoms } from '@allin/db-atom';
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
  addMessage: async (channelId: string, message: UIMessage) => {
    await DB.addMessage(channelId, message);
  },
  deleteMessagesByChannelId: async (channelId: string) => {
    await DB.deleteMessagesByChannelId(channelId);
  },
} satisfies AllinDbAdapter;

const { isDataBaseInitializedAtom, dbAtoms } = createDbAtoms({
  db: dbAdapter,
  parseProviderName: LLMProviderNameSchema.parse,
  parseModelId: AllModelIdsSchema.parse,
});

export { isDataBaseInitializedAtom, dbAtoms };
