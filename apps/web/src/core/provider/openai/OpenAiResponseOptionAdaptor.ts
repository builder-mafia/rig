import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import { match } from 'ts-pattern';
import type { ModelResponseOptions, ReasoningEffort } from '../LLMProvider';
import type { ModelResponseOptionAdaptor } from '../ModelResponseOptionAdaptor';
import { openaiModelSpec } from './generated/openai-model-spec';
import { type OpenAiModelId, OpenAiModelIdSchema } from './openai-models';

export class OpenAiResponseOptionAdaptor
  implements ModelResponseOptionAdaptor<OpenAIResponsesProviderOptions>
{
  private canReason = (modelId: OpenAiModelId): boolean => {
    const currentModelSpec = openaiModelSpec[modelId];
    return currentModelSpec.reasoning;
  };

  private mapReasoningEffort = (
    reasoning: ReasoningEffort,
    modelId: OpenAiModelId,
  ) => {
    return match(reasoning)
      .with('none', () => (modelId === 'gpt-5.1' ? 'none' : 'minimal'))
      .with('minimal', () => 'minimal')
      .with('low', () => 'low')
      .with('medium', () => 'medium')
      .with('high', () => 'high')
      .exhaustive();
  };

  public adapt(
    _modelId: string,
    options?: ModelResponseOptions,
  ): OpenAIResponsesProviderOptions {
    if (!options) {
      return {};
    }
    const modelId = OpenAiModelIdSchema.parse(_modelId);
    const { reasoning, reasoningSummary } = options;
    const isSupportReasoning = this.canReason(modelId);

    const ret: OpenAIResponsesProviderOptions = {};

    if (isSupportReasoning && reasoning) {
      ret.reasoningEffort = this.mapReasoningEffort(reasoning, modelId);
    }

    if (isSupportReasoning && reasoningSummary) {
      ret.reasoningSummary = reasoningSummary;
    }

    return ret;
  }
}
