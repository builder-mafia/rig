import z from 'zod';
import type { Replace } from '@/lib/utility-type';

export type LLMModelMap = {
  google: GoogleAiModel;
  openai: OpenAiModel;
};

export type LLMProvider = 'google' | 'openai';

export const OpenAiModelSchema = z.enum([
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-4.1-nano',
  'gpt-5',
  'gpt-5-mini',
  'gpt-5-nano',
  'gpt-5-codex',
  'gpt-5.1-codex',
  'gpt-5.1-codex-mini',
  'gpt-5.1',
]);

export type OpenAiModel = z.infer<typeof OpenAiModelSchema>;

/**
 * UI Display Name
 * gpt-4.1 => GPT 4.1
 * gpt-5-nano => GPT 5 nano
 */
export type OpenAiModelDisplay =
  OpenAiModel extends `${infer Prefix}-${infer Suffix}`
    ? `${Uppercase<Prefix>} ${Replace<Suffix, '-', ' '>}`
    : Uppercase<OpenAiModel>;

export const GoogleAiModelSchema = z.enum([
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-3-pro-preview',
]);

export type GoogleAiModel = z.infer<typeof GoogleAiModelSchema>;

/**
 * UI Display Name
 * gemini-2.0-flash => Gemini 2.5 Flash
 * gemini-2.5-pro => Gemini 2.5 Pro
 */
export type GoogleAiModelDisplay =
  GoogleAiModel extends `${infer Prefix}-${infer Version}-${infer Suffix}`
    ? `${Capitalize<Prefix>} ${Version} ${Capitalize<Suffix>}`
    : GoogleAiModel;

export const AiModelMap: AiModelMapType = {
  openai: [
    {
      name: 'gpt-4.1',
      display: 'GPT 4.1',
    },
    {
      name: 'gpt-4.1-mini',
      display: 'GPT 4.1 mini',
    },
    {
      name: 'gpt-4.1-nano',
      display: 'GPT 4.1 nano',
    },
    {
      name: 'gpt-5-codex',
      display: 'GPT 5 codex',
    },
    {
      name: 'gpt-5',
      display: 'GPT 5',
    },
    {
      name: 'gpt-5-mini',
      display: 'GPT 5 mini',
    },
    {
      name: 'gpt-5-nano',
      display: 'GPT 5 nano',
    },
    {
      name: 'gpt-5.1-codex',
      display: 'GPT 5.1 codex',
    },
    {
      name: 'gpt-5.1-codex-mini',
      display: 'GPT 5.1 codex mini',
    },
    {
      name: 'gpt-5.1',
      display: 'GPT 5.1',
    },
  ],
  google: [
    {
      name: 'gemini-2.5-flash-lite',
      display: 'Gemini 2.5 Flash-lite',
      thinking: true,
    },
    {
      name: 'gemini-2.5-flash',
      display: 'Gemini 2.5 Flash',
      thinking: true,
    },
    {
      name: 'gemini-2.5-pro',
      display: 'Gemini 2.5 Pro',
      thinking: true,
    },
    {
      name: 'gemini-3-pro-preview',
      display: 'Gemini 3 Pro-preview',
    },
  ],
};

export type AiModelMapType = {
  openai: Array<{
    name: OpenAiModel;
    display: OpenAiModelDisplay;
    thinking?: boolean;
  }>;
  google: Array<{
    name: GoogleAiModel;
    display: GoogleAiModelDisplay;
    thinking?: boolean;
  }>;
};

/**
 * @example
 * getProviderFromModel('gpt-4.1') => 'openai'
 * getProviderFromModel('gpt-5-nano') => 'openai'
 * getProviderFromModel('gemini-2.5-flash') => 'google'
 * getProviderFromModel('gemini-3-pro-preview') => 'google'
 */
export const getProviderFromModel = (model: LLMModel): LLMProvider => {
  if (AiModelMap.openai.some(m => m.name === model)) {
    return 'openai' as const;
  } else if (AiModelMap.google.some(m => m.name === model)) {
    return 'google' as const;
  } else {
    throw new Error(`getProviderFromModel: Invalid model Name: ${model}`);
  }
};

export const LLMModelSchema = z.union([OpenAiModelSchema, GoogleAiModelSchema]);
export type LLMModel = z.infer<typeof LLMModelSchema>;

/**
 * check if the model is valid string.
 * if not valid, throw an error.
 */
export function assertModel(model: string): asserts model is LLMModel {
  LLMModelSchema.parse(model);
}
