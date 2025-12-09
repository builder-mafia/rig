import type { ModelResponseOptions } from '../LLMProvider';
import type { ModelResponseOptionAdaptor } from '../ModelResponseOptionAdaptor';

export class MockResponseOptionAdaptor implements ModelResponseOptionAdaptor {
  adapt(modelId: string, options?: ModelResponseOptions) {
    return {};
  }
}
