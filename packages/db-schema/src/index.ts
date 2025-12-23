import type { UIMessageMetadata } from '@allin/message-metadata-schema';
import type { UIMessage } from 'ai';
import { z } from 'zod/v3';

// ** Channel Schema ** //
export const ReasoningEffortSchema = z
  .enum(['none', 'low', 'medium', 'high'])
  .describe('Reasoning effort')
  .default('low');

export const ReasoningSummarySchema = z
  .boolean()
  .describe('Whether to include reasoning summary')
  .default(false);

export const ChannelSchema = z.object({
  id: z.string(),
  /**
   * @description model id.
   * @example 'gpt-5.1'
   */
  model: z.string().describe('selected AI model'),
  providerName: z.string().describe('selected AI provider'),
  reasoningEffort: ReasoningEffortSchema,
  reasoningSummary: ReasoningSummarySchema,
  createdAt: z.number().min(0).describe('Timestamp of creation'),
  updatedAt: z.number().min(0).describe('Timestamp of last update'),
  title: z.string().optional().describe('Channel title'),
  description: z.string().optional().describe('Channel description'),
  prompt: z.string().optional().describe('AI system prompt'),
  isEmpty: z
    .boolean()
    .default(true)
    .describe(
      'Whether the channel is empty. If true, it means the channel has no messages.',
    ),
  pin: z
    .object({
      order: z.number().min(0).describe('Pin order of the channel'),
      createdAt: z.number().min(0).describe('Timestamp of pinning'),
    })
    .optional()
    .describe('Pinned status of the channel'),
});

export type Channel = z.infer<typeof ChannelSchema>;

// ** Config Schema ** //
export const ConfigSchema = z.object({
  lastSelectedChannelId: z.string().optional(),
  apiKeys: z.record(z.string(), z.string()),
});

export type Config = z.infer<typeof ConfigSchema>;

export const DB_CONFIG_KEY = 'userConfig';

// ** Message Schema (type only) ** //
export type DB_MESSAGE = UIMessage<UIMessageMetadata> & { channelId: string };

// ** Shared DB Constants ** //
export const DB_NAME = 'ALLIN';

export const DB_STORE = {
  CHANNELS: 'channels',
  MESSAGES: 'messages',
  CONFIG: 'config',
} as const;

export type DBStoreName = (typeof DB_STORE)[keyof typeof DB_STORE];
