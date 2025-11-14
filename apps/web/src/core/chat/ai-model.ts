import type { Replace } from '@/lib/utility-type';

export type LLMModelNameMap = {
  google: GoogleAiModel;
  openai: OpenAiModel;
};

export type LLMProvider = 'google' | 'openai';

export type OpenAiModel =
  | 'gpt-4.1'
  | 'gpt-4.1-mini'
  | 'gpt-4.1-nano'
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4'
  | 'gpt-5'
  | 'gpt-5-mini'
  | 'gpt-5-nano';

/**
 * UI Display Name
 * gpt-4.1 => GPT 4.1
 * gpt-5-nano => GPT 5 nano
 */
export type OpenAiModelDisplay =
  OpenAiModel extends `${infer Prefix}-${infer Suffix}`
    ? `${Uppercase<Prefix>} ${Replace<Suffix, '-', ' '>}`
    : Uppercase<OpenAiModel>;

export type GoogleAiModel =
  | 'gemini-2.0-flash'
  | 'gemini-2.5-flash-lite'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-pro';

/**
 * UI Display Name
 * gemini-2.0-flash => Gemini 2.5 Flash
 * gemini-2.5-pro => Gemini 2.5 Pro
 */
export type GoogleAiModelDisplay =
  GoogleAiModel extends `${infer Prefix}-${infer Version}-${infer Suffix}`
    ? `${Capitalize<Prefix>} ${Version} ${Capitalize<Suffix>}`
    : GoogleAiModel;
