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
      name: 'gpt-4o',
      display: 'GPT 4o',
    },
    {
      name: 'gpt-4o-mini',
      display: 'GPT 4o mini',
    },
    {
      name: 'gpt-4',
      display: 'GPT 4',
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
  ],
  google: [
    {
      name: 'gemini-2.0-flash',
      display: 'Gemini 2.0 Flash',
    },
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
