import type { ModelResponseOptionAdaptor } from '../ModelResponseOptionAdaptor';
import type { ModelResponseOptions } from '../types';

export class MockResponseOptionAdaptor implements ModelResponseOptionAdaptor {
  adapt(modelId: string, options?: ModelResponseOptions) {
    return {};
  }
}
