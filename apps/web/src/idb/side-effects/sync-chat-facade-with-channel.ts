import type { ChannelSchema } from '@allin/db-schema';
import type { z } from 'zod';
import { ChatFacadeManager } from '@/core/chat/ChatFacadeManager';
import type { LLMProviderName } from '@/core/provider/all-models';
import { providerRegistry } from '@/core/provider/providerRegistry';

type SelectedChannelSnapshot = Pick<
  z.infer<typeof ChannelSchema>,
  | 'id'
  | 'providerName'
  | 'model'
  | 'reasoningEffort'
  | 'reasoningSummary'
  | 'prompt'
>;

// snapshot of channel
let prevSnapshot: SelectedChannelSnapshot | undefined;

const hasChatFacadeForChannel = (channelId: string): boolean => {
  return ChatFacadeManager.getInstance().hasChatFacade(channelId);
};

const isProviderAvailableForChannel = (
  channel: SelectedChannelSnapshot,
): boolean => {
  return providerRegistry.has(channel.providerName as LLMProviderName);
};

const syncProviderAndModel = (snapshot: SelectedChannelSnapshot) => {
  const providerOrModelChanged =
    !prevSnapshot ||
    prevSnapshot.providerName !== snapshot.providerName ||
    prevSnapshot.model !== snapshot.model;

  if (!providerOrModelChanged) return;

  const provider = providerRegistry.get(
    snapshot.providerName as LLMProviderName,
  );
  const facade = ChatFacadeManager.getInstance().getChatFacade(snapshot.id);
  facade.updateProvider(provider, snapshot.model);
};

const syncReasoningOptions = (snapshot: SelectedChannelSnapshot) => {
  const reasoningChanged =
    !prevSnapshot ||
    prevSnapshot.reasoningEffort !== snapshot.reasoningEffort ||
    prevSnapshot.reasoningSummary !== snapshot.reasoningSummary;

  if (!reasoningChanged) return;

  const facade = ChatFacadeManager.getInstance().getChatFacade(snapshot.id);

  facade.updateModelResponseOptions({
    reasoning: snapshot.reasoningEffort,
    reasoningSummary: snapshot.reasoningSummary,
  });
};

export const syncChatFacadeWithChannelIfPossible = async (
  channel: z.infer<typeof ChannelSchema>,
) => {
  const snapshot: SelectedChannelSnapshot = {
    id: channel.id,
    providerName: channel.providerName,
    model: channel.model,
    reasoningEffort: channel.reasoningEffort,
    reasoningSummary: channel.reasoningSummary,
  };

  // if chat facade is not found, it means channel is first time selected and chat facade is creating.
  // we don't need to sync chat facade because it's in creating process.
  if (
    !hasChatFacadeForChannel(snapshot.id) ||
    !isProviderAvailableForChannel(snapshot)
  ) {
    prevSnapshot = snapshot;
    return;
  }

  syncProviderAndModel(snapshot);
  syncReasoningOptions(snapshot);

  prevSnapshot = snapshot;
};
