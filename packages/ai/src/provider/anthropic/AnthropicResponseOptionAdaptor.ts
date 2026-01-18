import type { AnthropicProviderOptions } from '@ai-sdk/anthropic';
import { match } from 'ts-pattern';
import type { ModelResponseOptionAdaptor } from '../ModelResponseOptionAdaptor';
import type { ModelResponseOptions, ReasoningEffort } from '../types';
import { anthropicModelSpec } from './generated/anthropic-model-spec';
import {
  type AnthropicModelId,
  AnthropicModelIdSchema,
} from './anthropic-models';

export class AnthropicResponseOptionAdaptor
  implements ModelResponseOptionAdaptor<AnthropicProviderOptions>
{
  private canReason = (modelId: AnthropicModelId): boolean => {
    return anthropicModelSpec[modelId].reasoning;
  };

  private mapThinkingBudget(reasoning?: ReasoningEffort): number | undefined {
    if (!reasoning || reasoning === 'none') {
      return undefined;
    }

    return match(reasoning)
      .with('low', () => 5000)
      .with('medium', () => 10000)
      .with('high', () => 20000)
      .exhaustive();
  }

  public adapt(
    _modelId: string,
    options?: ModelResponseOptions,
  ): AnthropicProviderOptions {
    if (!options) {
      return {};
    }
    const modelId: AnthropicModelId = AnthropicModelIdSchema.parse(_modelId);
    const isSupportReasoning = this.canReason(modelId);
    const { reasoning } = options;

    const ret: AnthropicProviderOptions = {};

    if (isSupportReasoning && reasoning && reasoning !== 'none') {
      const thinkingBudget = this.mapThinkingBudget(reasoning);
      if (thinkingBudget !== undefined) {
        ret.thinking = {
          type: 'enabled',
          budgetTokens: thinkingBudget,
        };
      }
    }

    return ret;
  }
}
