export type CommandViewId =
  | 'home'
  | 'providers'
  | 'provider-config'
  | 'model-select';

export type CommandViewState = {
  viewId: CommandViewId | null;
  props?: Record<string, unknown>;
};
