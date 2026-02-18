import { generateUIMessage, type ProviderId } from '@allin/ai';
import { delay } from 'es-toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockAgentManager } from '@/business/agent/test/createMockAgentManager';
import { createMockAgent } from '@/lib/gateway/agent/test/createMockAgent';
import { renderHookWithServices } from '@/test-utils/renderWithServices';
import { createMockChatFacade } from '../../facade/createMockChatFacade';
import { useSyncTransport } from '../useSyncTransport';

vi.mock('@tauri-apps/api/core', () => ({
  Channel: vi.fn(),
  invoke: vi.fn(),
}));

const CHUNK_DELAY = 30;

const agentA = createMockAgent({
  id: 'a',
  name: 'Agent A',
  providerId: 'anthropic',
  modelId: 'opus',
});

const agentB = createMockAgent({
  id: 'b',
  name: 'Agent B',
  providerId: 'openai',
  modelId: 'gpt-4',
});

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('useSyncTransport', () => {
  it('Before calling setSelectedAgent, should not call updateTransport', () => {
    const mockAgentManager = createMockAgentManager({
      agents: [agentA],
    });
    const facade = createMockChatFacade({
      initialMessages: [],
      providerName: agentA.providerName as ProviderId,
      modelId: agentA.model,
    });

    const spy = vi
      .spyOn(facade, 'updateTransport')
      .mockImplementation(() => {});

    renderHookWithServices(() => useSyncTransport(facade), {
      agentManager: mockAgentManager,
    });

    expect(spy).not.toHaveBeenCalled();
  });

  it('should not call updateTransport when agent is not found in agents list', () => {
    const facade = createMockChatFacade({ initialMessages: [] });
    const spy = vi
      .spyOn(facade, 'updateTransport')
      .mockImplementation(() => {});
    const mockAgentManager = createMockAgentManager({
      agents: [agentA],
    });

    renderHookWithServices(() => useSyncTransport(facade), {
      agentManager: mockAgentManager,
    });

    mockAgentManager.setSelectedAgent('nonexistent');

    expect(spy).not.toHaveBeenCalled();
  });

  it('After calling setSelectedAgent, should call updateTransport', () => {
    const mockAgentManager = createMockAgentManager({
      agents: [agentA, agentB],
    });
    const facade = createMockChatFacade({
      initialMessages: [],
      providerName: agentA.providerName as ProviderId,
      modelId: agentA.model,
    });

    mockAgentManager.setSelectedAgent('a');

    expect(facade.providerId).toBe(agentA.providerName);
    expect(facade.modelId).toBe(agentA.model);

    renderHookWithServices(() => useSyncTransport(facade), {
      agentManager: mockAgentManager,
    });

    mockAgentManager.setSelectedAgent('b');

    expect(facade.providerId).toBe(agentB.providerName);
    expect(facade.modelId).toBe(agentB.model);
  });

  it('should wait for finish$ before updating transport when streaming', async () => {
    const mockAgentManager = createMockAgentManager({
      agents: [agentA, agentB],
    });
    const facade = createMockChatFacade({
      initialMessages: [],
      chunkDelay: CHUNK_DELAY,
      providerName: agentA.providerName as ProviderId,
      modelId: agentA.model,
    });
    const spy = vi
      .spyOn(facade, 'updateTransport')
      .mockImplementation(() => {});

    renderHookWithServices(() => useSyncTransport(facade), {
      agentManager: mockAgentManager,
    });

    facade.sendMessage(generateUIMessage('user', 'Hi'));

    mockAgentManager.setSelectedAgent('a');

    expect(spy).not.toHaveBeenCalled();

    await delay(CHUNK_DELAY * 10);

    expect(spy).toHaveBeenCalledOnce();
  });

  it('should cancel pending finish$ wait when agent changes (switchMap)', async () => {
    const mockAgentManager = createMockAgentManager({
      agents: [agentA, agentB],
    });
    const facade = createMockChatFacade({
      initialMessages: [],
      chunkDelay: CHUNK_DELAY,
      providerName: agentA.providerName as ProviderId,
      modelId: agentA.model,
    });

    renderHookWithServices(() => useSyncTransport(facade), {
      agentManager: mockAgentManager,
    });

    facade.sendMessage(generateUIMessage('user', 'Hi'));

    mockAgentManager.setSelectedAgent('a');
    mockAgentManager.setSelectedAgent('b');
    mockAgentManager.setSelectedAgent('a');
    mockAgentManager.setSelectedAgent('b');

    await delay(CHUNK_DELAY * 10);

    expect(facade.providerId).toBe(agentB.providerName);
    expect(facade.modelId).toBe(agentB.model);
  });
});
