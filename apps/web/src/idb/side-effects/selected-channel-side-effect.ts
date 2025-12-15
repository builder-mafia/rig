import { atom } from 'jotai';
import { assert } from '@/utils/assert';
import { dbAtoms } from '../db-store';
import { syncChatFacadeWithChannelIfPossible } from './sync-chat-facade-with-channel';

export const selectedChannelSideEffectAtom = atom(async get => {
  const channel = await get(dbAtoms.selectedChannelAtom);
  assert(
    channel,
    'selectedChannelSideEffectAtom: selectedChannel is not found',
  );
  await syncChatFacadeWithChannelIfPossible(channel);

  // this async atom is used for side-effect, return 0 to avoid infinite loop. (if return null, it will be infinite loop.)
  return 0;
});
