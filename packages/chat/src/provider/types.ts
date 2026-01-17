import type {
  ReasoningEffortSchema,
  ReasoningSummarySchema,
} from '@allin/db-schema';
import type { z } from 'zod/v3';

export type ReasoningEffort = z.infer<typeof ReasoningEffortSchema>;
export type ReasoningSummary = z.infer<typeof ReasoningSummarySchema>;

export type ModelResponseOptions = {
  reasoning?: ReasoningEffort;
  reasoningSummary?: ReasoningSummary;
};
