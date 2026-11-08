import { z } from 'zod';

const jsonSchema: z.ZodType<JsonSchema, z.ZodTypeDef, unknown> = z.lazy(() =>
  z.union([
    z.boolean().transform(() => ({})),
    z.object({
      $ref: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      type: z.union([z.string(), z.string().array()]).optional(),
      properties: z.record(jsonSchema).optional(),
      additionalProperties: z.union([z.boolean(), jsonSchema]).optional(),
      definitions: z.record(jsonSchema).optional(),
      $defs: z.record(jsonSchema).optional(),
      required: z.string().array().optional(),
      enum: z.unknown().array().optional(),
      const: z.unknown().optional(),
      default: z.unknown().optional(),
      anyOf: jsonSchema.array().optional(),
      oneOf: jsonSchema.array().optional(),
      allOf: jsonSchema.array().optional(),
      items: jsonSchema.optional(),
      writeOnly: z.boolean().optional(),
    }),
  ]),
);

export const configFormatSchema = z.enum(['json', 'toml', 'text']);
const fileSummarySchema = z.object({
  id: z.string(),
  label: z.string(),
  path: z.string(),
  format: configFormatSchema,
  exists: z.boolean(),
  hasSchema: z.boolean(),
  error: z.string().nullable(),
});
export const configPluginSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string(),
  icon: z.string(),
  homepage: z.string().nullable(),
  installed: z.boolean(),
  builtin: z.boolean(),
  files: z.array(fileSummarySchema),
});
export const configDocumentSchema = z.object({
  path: z.string(),
  format: configFormatSchema,
  exists: z.boolean(),
  content: z.string().nullable(),
  value: z.unknown(),
  schema: jsonSchema.nullable(),
  parseError: z.string().nullable(),
  revision: z.string().nullable(),
});
export const pluginPreviewSchema = z.object({
  plugin: configPluginSchema,
  revision: z.string(),
});
export type ConfigPlugin = z.infer<typeof configPluginSchema>;
export type ConfigDocument = z.infer<typeof configDocumentSchema>;
export type PluginPreview = z.infer<typeof pluginPreviewSchema>;
export type ConfigPath = readonly (string | number)[];
export type ConfigEdit =
  | { kind: 'source'; content: string }
  | { kind: 'property'; path: ConfigPath; value: string }
  | { kind: 'removeProperty'; path: ConfigPath };
export type SaveConfigEdit = (
  edit: ConfigEdit,
  revision: string | null,
) => Promise<void>;

export interface JsonSchema {
  $ref?: string;
  title?: string;
  description?: string;
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  additionalProperties?: boolean | JsonSchema;
  definitions?: Record<string, JsonSchema>;
  $defs?: Record<string, JsonSchema>;
  required?: string[];
  enum?: unknown[];
  const?: unknown;
  default?: unknown;
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  allOf?: JsonSchema[];
  items?: JsonSchema;
  writeOnly?: boolean;
}
