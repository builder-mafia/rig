import { z } from 'zod';

export const PluginToolIdSchema = z.enum(['claude-code', 'opencode']);

export const PluginTargetSchema = z.object({
  id: PluginToolIdSchema,
  name: z.string(),
  isInstalled: z.boolean(),
});

export const PluginInstallErrorCodeSchema = z.enum([
  'toolNotFound',
  'commandFailed',
  'commandTimedOut',
  'configJsoncUnsupported',
  'configParseFailed',
  'configWriteFailed',
  'invalidConfigShape',
  'verificationFailed',
  'unsupportedTarget',
]);

export const PluginInstallErrorSchema = z.object({
  code: PluginInstallErrorCodeSchema,
  message: z.string(),
  details: z.string().nullable(),
});

export type PluginToolId = z.infer<typeof PluginToolIdSchema>;
export type PluginTarget = z.infer<typeof PluginTargetSchema>;
export type PluginInstallErrorCode = z.infer<
  typeof PluginInstallErrorCodeSchema
>;
export type PluginInstallError = z.infer<typeof PluginInstallErrorSchema>;
