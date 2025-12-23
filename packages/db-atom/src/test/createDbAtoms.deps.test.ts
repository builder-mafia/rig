import type { ChannelSchema, ConfigSchema } from '@allin/db-schema';
import type { UIMessage } from 'ai';
import { createStore } from 'jotai/vanilla';
import { describe, expect, it } from 'vitest';
import { z } from 'zod/v3';
import { type AllinDbAdapter, createDbAtoms } from '../index';

type Channel = z.infer<typeof ChannelSchema>;
type Config = z.infer<typeof ConfigSchema>;

type InMemoryDbState = {
  channels: Channel[];
  config: Config;
};

function createInMemoryDbAdapter(initial: InMemoryDbState) {
  const state: InMemoryDbState = {
    channels: [...initial.channels],
    config: {
      ...initial.config,
      apiKeys: { ...initial.config.apiKeys },
    },
  };

  const calls = {
    getConfig: 0,
    updateConfig: 0,
    getChannels: 0,
  };

  const db: AllinDbAdapter = {
    getChannels: async () => {
      calls.getChannels += 1;
      return state.channels;
    },
    createChannel: async (channel: Channel) => {
      state.channels = [...state.channels, channel];
      return channel.id;
    },
    updateChannel: async (channelId: string, patch: Partial<Channel>) => {
      state.channels = state.channels.map(c =>
        c.id === channelId ? { ...c, ...patch } : c,
      );
    },
    deleteChannel: async (channelId: string) => {
      state.channels = state.channels.filter(c => c.id !== channelId);
    },

    getConfig: async () => {
      calls.getConfig += 1;
      return state.config;
    },
    updateConfig: async (patch: Partial<Config>) => {
      calls.updateConfig += 1;
      state.config = {
        ...state.config,
        ...patch,
        apiKeys: patch.apiKeys ?? state.config.apiKeys,
      };
    },

    getMessages: async () => [],
    addMessage: async (_channelId: string, _message: UIMessage) => {},
    deleteMessagesByChannelId: async (_channelId: string) => {},
  };

  return { db, calls };
}

function createChannel(id: string, overrides?: Partial<Channel>): Channel {
  const now = Date.now();
  return {
    id,
    providerName: 'openai',
    model: 'gpt-5',
    reasoningEffort: 'low',
    reasoningSummary: false,
    createdAt: now,
    updatedAt: now,
    isEmpty: true,
    ...overrides,
  };
}

describe('createDbAtoms: atom dependency updates', () => {
  it('after update config, configAtom reflects new values', async () => {
    const { db, calls } = createInMemoryDbAdapter({
      channels: [],
      config: {
        apiKeys: {},
      },
    });

    const atoms = createDbAtoms(db);
    const store = createStore();

    const before = await store.get(atoms.configAtom);
    expect(before.apiKeys).toEqual({});

    await store.set(atoms.updateConfigAtom, {
      apiKeys: {
        openai: 'test-openai-key',
      },
    });

    const after = await store.get(atoms.configAtom);
    expect(after.apiKeys.openai).toBe('test-openai-key');

    // dependency check: refresh atom forces another getConfig call
    expect(calls.updateConfig).toBe(1);
    expect(calls.getConfig).toBeGreaterThanOrEqual(2);
  });

  it('after update selected channel id, configAtom.lastSelectedChannelId is updated and selectedChannelIdAtom/selectedChannelAtom are refreshed', async () => {
    const channelA = createChannel('channel-a', {
      model: 'gpt-5',
      providerName: 'openai',
    });
    const channelB = createChannel('channel-b', { providerName: 'google' });

    const { db } = createInMemoryDbAdapter({
      channels: [channelA, channelB],
      config: {
        apiKeys: {},
      },
    });

    const atoms = createDbAtoms(db);
    const store = createStore();

    const beforeSelectedId = await store.get(atoms.selectedChannelIdAtom);
    const beforeSelectedChannel = await store.get(atoms.selectedChannelAtom);
    expect(beforeSelectedId).toBeNull();
    expect(beforeSelectedChannel).toBeNull();

    await store.set(atoms.updateSelectedChannelIdAtom, 'channel-a');

    const configAfter = await store.get(atoms.configAtom);
    expect(configAfter.lastSelectedChannelId).toBe('channel-a');

    const selectedIdAfter = await store.get(atoms.selectedChannelIdAtom);
    expect(selectedIdAfter).toBe('channel-a');

    const selectedChannelAfter = await store.get(atoms.selectedChannelAtom);
    expect(selectedChannelAfter?.id).toBe('channel-a');
    expect(selectedChannelAfter?.providerName).toBe('openai');
    expect(selectedChannelAfter?.model).toBe('gpt-5');
  });

  it('after update channel, allChannelsAtom is refreshed and selectedChannelAtom is updated', async () => {
    const channelA = createChannel('channel-a', {
      model: 'gpt-5',
      providerName: 'openai',
    });
    const channelB = createChannel('channel-b', {
      model: 'gemini-2.5',
      providerName: 'google',
    });

    const { db, calls } = createInMemoryDbAdapter({
      channels: [channelA, channelB],
      config: {
        apiKeys: {},
        lastSelectedChannelId: 'channel-a',
      },
    });

    const atoms = createDbAtoms(db);
    const store = createStore();

    const beforeSelectedChannel = await store.get(atoms.selectedChannelAtom);
    expect(beforeSelectedChannel?.id).toBe('channel-a');
    expect(beforeSelectedChannel?.title).toBeUndefined();

    await store.set(atoms.updateChannelAtom, 'channel-a', {
      title: 'updated title',
    });

    const afterSelectedChannel = await store.get(atoms.selectedChannelAtom);
    expect(afterSelectedChannel?.id).toBe('channel-a');
    expect(afterSelectedChannel?.title).toBe('updated title');

    // dependency check: updateChannelAtom increments refresh atom, so getChannels should be called again
    expect(calls.getChannels).toBeGreaterThanOrEqual(2);
  });
});
