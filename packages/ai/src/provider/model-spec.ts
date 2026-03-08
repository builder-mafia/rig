import { z } from 'zod/v3';

export const ModelCostSchema = z.object({
  input: z.number().optional(),
  output: z.number().optional(),
  cache_read: z.number().optional(),
  cache_write: z.number().optional(),
  input_audio: z.number().optional(),
  context_over_200k: z
    .object({
      input: z.number().optional(),
      output: z.number().optional(),
      cache_read: z.number().optional(),
      cache_write: z.number().optional(),
    })
    .optional(),
});

export const ModelLimitSchema = z.object({
  context: z.number().optional(),
  output: z.number().optional(),
  input: z.number().optional(),
});

export const ModalitySchema = z.enum([
  'text',
  'image',
  'audio',
  'video',
  'pdf',
]);

export const ModelModalitiesSchema = z.object({
  input: z.array(ModalitySchema),
  output: z.array(ModalitySchema),
});

export const ModelSpecSchema = z.object({
  id: z.string(),
  name: z.string(),
  family: z.string().optional(),
  attachment: z.boolean(),
  reasoning: z.boolean(),
  tool_call: z.boolean(),
  structured_output: z.boolean().optional(),
  temperature: z.boolean(),
  knowledge: z.string().optional(),
  release_date: z.string(),
  last_updated: z.string(),
  modalities: ModelModalitiesSchema,
  open_weights: z.boolean(),
  interleaved: z.boolean().optional(),
  cost: ModelCostSchema.optional(),
  limit: ModelLimitSchema,
});

export type ModelCost = z.infer<typeof ModelCostSchema>;
export type ModelLimit = z.infer<typeof ModelLimitSchema>;
export type ModelModalities = z.infer<typeof ModelModalitiesSchema>;
export type ModelSpec = z.infer<typeof ModelSpecSchema>;
