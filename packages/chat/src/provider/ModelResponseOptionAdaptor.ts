import type { ModelResponseOptions } from './LLMProvider';

export interface ModelResponseOptionAdaptor<ReturnType = unknown> {
  adapt: (modelId: string, options?: ModelResponseOptions) => ReturnType;
}
