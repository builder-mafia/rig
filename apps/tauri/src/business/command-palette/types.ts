export type CommandPaneId =
  | 'home'
  | 'providers'
  | 'provider-config'
  | 'model-select'
  | 'channels';

export type CommandPaneState = {
  paneId: CommandPaneId | null;
  paneProps?: Record<string, unknown>;
};
