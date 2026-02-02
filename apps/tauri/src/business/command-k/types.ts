export type CommandViewId =
  | 'home'
  | 'providers'
  | 'provider-config'
  | 'model-select'
  | 'channels';

export type CommandViewState = {
  viewId: CommandViewId | null;
  props?: Record<string, unknown>;
};
