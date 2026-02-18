import { beforeEach, describe, expect, it, vi } from 'vitest';
import { agentGateway } from '@/lib/gateway/agent/agentGateway';
import { createMockAgent } from '@/lib/gateway/agent/test/createMockAgent';
import { AgentManager } from '../AgentManager';

vi.mock('@/lib/gateway/agent/agentGateway');
const mockedGateway = vi.mocked(agentGateway);

const resetSingleton = () => {
  // biome-ignore lint/suspicious/noExplicitAny: reset singleton for test isolation
  (AgentManager as any).instance = undefined;
};

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
const agentC = createMockAgent({
  id: 'c',
  name: 'Agent C',
  providerId: 'anthropic',
  modelId: 'sonnet',
});

beforeEach(() => {
  vi.clearAllMocks();
  resetSingleton();
});

describe('AgentManager', () => {
  describe('loadAgents', () => {
    it('should fetch agents from gateway and store them', async () => {
      mockedGateway.getAll.mockResolvedValue([agentA, agentB]);

      const manager = AgentManager.getInstance();
      await manager.loadAgents();

      expect(mockedGateway.getAll).toHaveBeenCalledOnce();
      expect(manager.agents).toHaveLength(2);
    });

    it('should sort agents by createdAt (newest first)', async () => {
      const older = { ...agentA, createdAt: 1000 };
      const newer = { ...agentB, createdAt: 2000 };
      mockedGateway.getAll.mockResolvedValue([older, newer]);

      const manager = AgentManager.getInstance();
      await manager.loadAgents();

      expect(manager.agents[0].id).toBe(newer.id);
      expect(manager.agents[1].id).toBe(older.id);
    });

    it('should return the loaded agents', async () => {
      mockedGateway.getAll.mockResolvedValue([agentA]);

      const manager = AgentManager.getInstance();
      await manager.loadAgents();

      expect(manager.agents[0].id).toBe(agentA.id);
    });
  });

  describe('setSelectedAgent', () => {
    it('should update selectedAgentId', async () => {
      mockedGateway.getAll.mockResolvedValue([agentA, agentB]);

      const manager = AgentManager.getInstance();
      await manager.loadAgents();

      manager.setSelectedAgent('a');
      expect(manager.selectedAgentId).toBe('a');
    });

    it('should throw an error if the agent is not found', async () => {
      const manager = AgentManager.getInstance();
      mockedGateway.getAll.mockResolvedValue([]);
      await manager.loadAgents();

      expect(() => manager.setSelectedAgent('nonexistent')).toThrow();
    });

    it('should emit new value through selectedAgentId$', async () => {
      mockedGateway.getAll.mockResolvedValue([agentA, agentB]);
      const manager = AgentManager.getInstance();

      await manager.loadAgents();

      manager.setSelectedAgent('b');

      manager.selectedAgentId$.subscribe(id => {
        expect(id).toBe('b');
      });
    });
  });

  describe('selectedAgent', () => {
    it('should return the agent matching selectedAgentId', async () => {
      mockedGateway.getAll.mockResolvedValue([agentA, agentB]);

      const manager = AgentManager.getInstance();
      await manager.loadAgents();
      manager.setSelectedAgent('b');

      expect(manager.selectedAgent).toEqual(agentB);
    });
  });

  describe('delete', () => {
    it('should call agentGateway.delete and reload agents', async () => {
      mockedGateway.getAll.mockResolvedValue([agentA, agentB]);
      mockedGateway.delete.mockResolvedValue(undefined);

      const manager = AgentManager.getInstance();
      await manager.loadAgents();
      manager.setSelectedAgent('a');

      mockedGateway.getAll.mockResolvedValue([agentB]);
      await manager.delete('a');

      expect(mockedGateway.delete).toHaveBeenCalledWith('a');
      expect(manager.agents).toHaveLength(1);
    });

    it('should reselect first agent when deleted agent was selected', async () => {
      mockedGateway.getAll.mockResolvedValue([agentA, agentB]);
      mockedGateway.delete.mockResolvedValue(undefined);

      const manager = AgentManager.getInstance();
      await manager.loadAgents();
      manager.setSelectedAgent('a');

      mockedGateway.getAll.mockResolvedValue([agentB]);
      await manager.delete('a');

      expect(manager.selectedAgentId).toBe('b');
    });

    it('should keep current selection when a different agent is deleted', async () => {
      mockedGateway.getAll.mockResolvedValue([agentA, agentB]);
      mockedGateway.delete.mockResolvedValue(undefined);

      const manager = AgentManager.getInstance();
      await manager.loadAgents();
      manager.setSelectedAgent('a');

      mockedGateway.getAll.mockResolvedValue([agentA]);
      await manager.delete('b');

      expect(manager.selectedAgentId).toBe('a');
    });
  });

  describe('cycleSelectedAgent', () => {
    it('should select the next agent in the list', async () => {
      mockedGateway.getAll.mockResolvedValue([agentA, agentB, agentC]);

      const manager = AgentManager.getInstance();
      await manager.loadAgents();
      manager.setSelectedAgent('a');

      manager.cycleSelectedAgent();
      expect(manager.selectedAgentId).toBe('b');

      manager.cycleSelectedAgent();
      expect(manager.selectedAgentId).toBe('c');

      manager.cycleSelectedAgent();
      expect(manager.selectedAgentId).toBe('a');
    });

    it('should do nothing when there is only one agent', async () => {
      mockedGateway.getAll.mockResolvedValue([agentA]);

      const manager = AgentManager.getInstance();
      await manager.loadAgents();
      manager.setSelectedAgent('a');

      manager.cycleSelectedAgent();

      expect(manager.selectedAgentId).toBe('a');
    });
  });
});
