import z from 'zod';

export const UIMessageMetadataSchema = z
  .object({
    modelId: z.string().optional(),
    provider: z.string().optional(),
    createdAt: z.number().optional(),
    inputTokens: z.number().optional(),
    outputTokens: z.number().optional(),
    reasoningTokens: z.number().optional(),
    cachedInputTokens: z.number().optional(),
    totalTokens: z.number().optional(),

    isError: z.boolean().optional(),
    isAborted: z.boolean().optional(),
    isDisconnected: z.boolean().optional(),
    errorMessage: z.string().optional(),
  })
  .optional();

export type UIMessageMetadata = z.infer<typeof UIMessageMetadataSchema>;
