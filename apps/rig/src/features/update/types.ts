import { z } from 'zod';

export const UpdateMetadataSchema = z.object({
  version: z.string(),
  currentVersion: z.string(),
});

export type UpdateMetadata = z.infer<typeof UpdateMetadataSchema>;
