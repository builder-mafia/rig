import { z } from 'zod';

export const SkillRootSchema = z.object({
  id: z.string(),
  path: z.string(),
  label: z.string(),
  exists: z.boolean(),
});

export const SkillValidationErrorCodeSchema = z.enum([
  'missingSkillFile',
  'emptySkillFile',
  'emptyContent',
  'invalidUtf8',
  'readFailed',
  'notDirectory',
  'outsideRoot',
  'missingFrontMatter',
  'invalidFrontMatter',
]);

export const SkillValidationErrorSchema = z.object({
  code: SkillValidationErrorCodeSchema,
  message: z.string(),
});

export const SkillListingErrorCodeSchema = z.enum([
  'pathNotFound',
  'notDirectory',
  'readFailed',
]);

export const SkillListingErrorSchema = z.object({
  code: SkillListingErrorCodeSchema,
  message: z.string(),
});

export const SkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  rootPath: z.string(),
  relativePath: z.string(),
  content: z.string(),
  description: z.string().nullable(),
  isValid: z.boolean(),
  validationError: SkillValidationErrorSchema.nullable(),
  updatedAt: z.string().nullable(),
});

export type SkillRoot = z.infer<typeof SkillRootSchema>;
export type SkillValidationErrorCode = z.infer<
  typeof SkillValidationErrorCodeSchema
>;
export type SkillValidationError = z.infer<typeof SkillValidationErrorSchema>;
export type SkillListingErrorCode = z.infer<typeof SkillListingErrorCodeSchema>;
export type SkillListingError = z.infer<typeof SkillListingErrorSchema>;
export type Skill = z.infer<typeof SkillSchema>;
