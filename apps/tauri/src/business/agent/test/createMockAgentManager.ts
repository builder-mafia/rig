import { vi } from 'vitest';
import { AgentManager } from '../AgentManager';

vi.mock('@/business/agent/AgentManager');

const mockedAgentManager = vi.mocked(AgentManager);
