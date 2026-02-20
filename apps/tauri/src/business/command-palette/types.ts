export type CommandPaneId =
  | 'home'
  | 'providers'
  | 'provider-config'
  | 'model-select'
  | 'channels'
  | 'agent-list'
  | 'agent-create'
  | 'agent-edit';

export type CommandPaneState = {
  paneId: CommandPaneId | null;
  paneProps?: Record<string, unknown>;
};
