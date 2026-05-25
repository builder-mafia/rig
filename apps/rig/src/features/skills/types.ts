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
  'invalidUtf8',
  'readFailed',
  'notDirectory',
  'outsideRoot',
]);

export const SkillValidationErrorSchema = z.object({
  code: SkillValidationErrorCodeSchema,
  message: z.string(),
});

export const SkillRootErrorCodeSchema = z.enum([
  'invalidRootPath',
  'rootNotDirectory',
  'permissionDenied',
  'readFailed',
  'pathOutsideAllowedRoots',
]);

export const SkillRootErrorSchema = z.object({
  code: SkillRootErrorCodeSchema,
  message: z.string(),
  rootPath: z.string(),
});

export const SkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  rootPath: z.string(),
  relativePath: z.string(),
  hasSkillFile: z.boolean(),
  description: z.string().nullable(),
  isValid: z.boolean(),
  validationErrors: z.array(SkillValidationErrorSchema),
  updatedAt: z.string().nullable(),
});

export const SkillDetailSchema = z.object({
  skill: SkillSchema,
  content: z.string(),
});

export type SkillRoot = z.infer<typeof SkillRootSchema>;
export type SkillValidationErrorCode = z.infer<
  typeof SkillValidationErrorCodeSchema
>;
export type SkillValidationError = z.infer<typeof SkillValidationErrorSchema>;
export type SkillRootErrorCode = z.infer<typeof SkillRootErrorCodeSchema>;
export type SkillRootError = z.infer<typeof SkillRootErrorSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type SkillDetail = z.infer<typeof SkillDetailSchema>;
