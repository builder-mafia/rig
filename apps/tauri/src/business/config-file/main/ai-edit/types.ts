export type AIEditHunkLineKind = 'add' | 'del' | 'ctx';

export type AIEditHunkLine = {
  kind: AIEditHunkLineKind;
  text: string;
};

export type AIEditHunk = {
  id: string;
  header: string;
  origStart: number;
  origLen: number;
  lines: AIEditHunkLine[];
};

export type AIEditProposal = {
  id: string;
  fileId: string;
  basedOnUpdatedAt: number;
  prompt: string;
  after: string;
  hunks: AIEditHunk[];
  summary?: string;
};

export type AIEditHunkDecision = 'pending' | 'applied' | 'rejected';

export type AIEditChatRole = 'user' | 'assistant' | 'system';

export type AIEditChatMessage = {
  id: string;
  role: AIEditChatRole;
  text: string;
  proposalId?: string;
  createdAt: number;
};

export type AIEditPhase = 'idle' | 'working' | 'proposal-pending' | 'applying';

export type AIEditVersionSource =
  | 'manual'
  | 'auto'
  | 'ai'
  | 'external'
  | 'editing';

export type AIEditVersionEntry = {
  id: string;
  label: string;
  detail?: string;
  source: AIEditVersionSource;
  when: string;
  current?: boolean;
  content?: string;
};
