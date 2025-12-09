import type { GoogleGenerativeAIProviderOptions } from '@ai-sdk/google';
import { match } from 'ts-pattern';
import type { ModelResponseOptions, ReasoningEffort } from '../LLMProvider';
import type { ModelResponseOptionAdaptor } from '../ModelResponseOptionAdaptor';
import { googleModelSpec } from './generated/google-model-spec';
import { type GoogleAiModelId, GoogleAiModelIdSchema } from './google-models';

export class GoogleResponseOptionAdaptor
  implements ModelResponseOptionAdaptor<GoogleGenerativeAIProviderOptions>
{
  private canReason = (modelId: GoogleAiModelId): boolean => {
    return googleModelSpec[modelId].reasoning;
  };

  private mapThinkingLevel(
    modelId: GoogleAiModelId,
    reasoning?: ReasoningEffort,
  ) {
    // thinking level is supported by Gemini 3 Pro Preview and later models.
    if (
      modelId !== 'gemini-3-pro-preview' ||
      !reasoning ||
      reasoning === 'none'
    ) {
      return null;
    }

    return match(reasoning)
      .with('minimal', () => 'low' as const)
      .with('low', () => 'low' as const)
      .with('medium', () => 'high' as const)
      .with('high', () => 'high' as const)
      .exhaustive();
  }

  private mapThinkingBudget(reasoning?: ReasoningEffort): number | undefined {
    if (!reasoning) {
      return undefined;
    }

    return match(reasoning)
      .with('none', () => 0)
      .otherwise(() => 8192);
  }

  public adapt(
    _modelId: string,
    options?: ModelResponseOptions,
  ): GoogleGenerativeAIProviderOptions {
    if (!options) {
      return {};
    }
    const modelId: GoogleAiModelId = GoogleAiModelIdSchema.parse(_modelId);
    const isSupportReasoning = this.canReason(modelId);
    const { reasoning, reasoningSummary } = options;

    const ret: GoogleGenerativeAIProviderOptions = {};

    if (isSupportReasoning && reasoning) {
      const thinkingLevel = this.mapThinkingLevel(modelId, reasoning);
      if (thinkingLevel) {
        ret.thinkingConfig = {
          ...(ret.thinkingConfig || {}),
          thinkingLevel,
        };
      }

      const thinkingBudget = this.mapThinkingBudget(reasoning);
      if (thinkingBudget) {
        ret.thinkingConfig = {
          ...(ret.thinkingConfig || {}),
          thinkingBudget,
        };
      }
    }

    if (isSupportReasoning && reasoningSummary) {
      ret.thinkingConfig = {
        ...(ret.thinkingConfig || {}),
        includeThoughts: true,
      };
    }

    return ret;
  }
}
