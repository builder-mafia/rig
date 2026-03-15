import type { ProviderId } from '@allin/ai';

export type CommandPanePropsMap = {
  home: undefined;
  channels: undefined;
  providers: undefined;
  'provider-config': { providerId: ProviderId };
  'model-select': undefined;
  'agent-list': undefined;
  'agent-create': undefined;
  'agent-edit': { agentId: string };
  'font-family': undefined;
};

export type CommandPaneId = keyof CommandPanePropsMap;

export type CommandPaneState = {
  paneId: CommandPaneId | null;
  paneProps?: CommandPanePropsMap[CommandPaneId];
};
