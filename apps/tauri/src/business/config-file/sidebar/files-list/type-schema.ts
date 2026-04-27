import { z } from 'zod/v4';

export const DraggableFileDataSchema = z.object({
  kind: z.literal('file'),
  fileId: z.string(),
  groupId: z.string().nullable(),
});

export const DroppableGroupDataSchema = z.object({
  kind: z.literal('group-container'),
  groupId: z.string(),
});
