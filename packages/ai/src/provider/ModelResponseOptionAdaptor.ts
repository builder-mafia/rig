import type { ModelResponseOptions } from './types';

export interface ModelResponseOptionAdaptor<ReturnType = unknown> {
  adapt: (modelId: string, options?: ModelResponseOptions) => ReturnType;
}
