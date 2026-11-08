import type { JsonSchema } from './types';

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const owns = (value: object, key: string) =>
  Object.prototype.hasOwnProperty.call(value, key);

const reference = (root: JsonSchema, path: string): JsonSchema | undefined => {
  if (path === '#') return root;
  if (!path.startsWith('#/')) return;
  let current: unknown = root;
  for (const key of path
    .slice(2)
    .split('/')
    .map(part => part.replaceAll('~1', '/').replaceAll('~0', '~'))) {
    if (!isRecord(current) || !owns(current, key)) return;
    current = current[key];
  }
  return isRecord(current) ? (current as JsonSchema) : undefined;
};

const typeMatches = (schema: JsonSchema, value: unknown) => {
  if (value === undefined) return schema.type !== 'null';
  if (schema.const !== undefined) return Object.is(schema.const, value);
  if (schema.enum) return schema.enum.some(option => Object.is(option, value));
  if (isRecord(value)) {
    if (schema.required?.some(key => !owns(value, key))) return false;
    if (
      Object.entries(schema.properties ?? {}).some(
        ([key, property]) =>
          owns(value, key) &&
          ((owns(property, 'const') &&
            !Object.is(property.const, value[key])) ||
            (property.enum &&
              !property.enum.some(option => Object.is(option, value[key])))),
      )
    )
      return false;
  }
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  return types.some(
    type =>
      !type ||
      (type === 'object'
        ? isRecord(value)
        : type === 'array'
          ? Array.isArray(value)
          : type === 'null'
            ? value === null
            : type === 'integer'
              ? Number.isInteger(value)
              : typeof value === type),
  );
};

// Resolves embedded refs only. Plugins never execute code or fetch remote schemas.
export const resolveSchema = (
  root: JsonSchema,
  schema: JsonSchema = {},
  value?: unknown,
  seen = new Set<string>(),
  depth = 0,
): JsonSchema => {
  if (depth > 20) return {};
  let resolved = schema;
  if (schema.$ref && !seen.has(schema.$ref)) {
    seen = new Set([...seen, schema.$ref]);
    const target = reference(root, schema.$ref);
    if (target)
      resolved = {
        ...resolveSchema(root, target, value, seen, depth + 1),
        ...schema,
      };
  }
  if (resolved.allOf) {
    for (const item of resolved.allOf) {
      const child = resolveSchema(root, item, value, seen, depth + 1);
      resolved = {
        ...child,
        ...resolved,
        ...(child.properties || resolved.properties
          ? { properties: { ...child.properties, ...resolved.properties } }
          : {}),
        ...(child.required || resolved.required
          ? {
              required: [
                ...new Set([
                  ...(child.required ?? []),
                  ...(resolved.required ?? []),
                ]),
              ],
            }
          : {}),
      };
    }
  }
  const variants = resolved.anyOf ?? resolved.oneOf;
  if (variants?.length) {
    const declaredEnum = resolved.enum;
    const declaredType = resolved.type;
    const options = variants.map(option =>
      resolveSchema(root, option, value, new Set(seen), depth + 1),
    );
    const selected =
      options.find(option => typeMatches(option, value)) ?? options[0];
    resolved = {
      ...selected,
      ...resolved,
      properties: resolved.properties ?? selected.properties,
    };
    if (!declaredType) {
      const types = [
        ...new Set(
          options.flatMap(
            option =>
              option.type ??
              (owns(option, 'const')
                ? option.const === null
                  ? 'null'
                  : typeof option.const
                : []),
          ),
        ),
      ];
      if (types.length) resolved.type = types.length === 1 ? types[0] : types;
    }
    if (!declaredEnum) {
      const choices = options.flatMap(
        option => option.enum ?? (owns(option, 'const') ? [option.const] : []),
      );
      if (choices.length) resolved.enum = choices;
    }
  }
  return resolved;
};

export interface ConfigField {
  key: string;
  schema: JsonSchema;
  value: unknown;
  configured: boolean;
  required: boolean;
  known: boolean;
}

export const getConfigFields = (
  root: JsonSchema,
  schema: JsonSchema,
  value: unknown,
): ConfigField[] => {
  const resolved = resolveSchema(root, schema, value);
  const current = isRecord(value) ? value : {};
  const properties = resolved.properties ?? {};
  const keys = new Set([...Object.keys(properties), ...Object.keys(current)]);
  return [...keys]
    .map(key => {
      const configured = owns(current, key);
      const known = owns(properties, key);
      const declaration = known
        ? properties[key]
        : isRecord(resolved.additionalProperties)
          ? (resolved.additionalProperties as JsonSchema)
          : {};
      return {
        key,
        schema: resolveSchema(
          root,
          declaration,
          configured ? current[key] : undefined,
        ),
        value: configured ? current[key] : undefined,
        configured,
        required: resolved.required?.includes(key) ?? false,
        known: known || isRecord(resolved.additionalProperties),
      };
    })
    .sort(
      (a, b) =>
        Number(b.configured) - Number(a.configured) ||
        a.key.localeCompare(b.key),
    );
};

export const fieldType = (schema: JsonSchema, value: unknown) => {
  if (schema.type)
    return Array.isArray(schema.type) ? schema.type.join(' | ') : schema.type;
  if (
    isRecord(value) ||
    schema.properties ||
    isRecord(schema.additionalProperties)
  )
    return 'object';
  if (Array.isArray(value)) return 'array';
  if (schema.enum?.length)
    return [
      ...new Set(
        schema.enum.map(option => (option === null ? 'null' : typeof option)),
      ),
    ].join(' | ');
  return value === undefined ? 'value' : value === null ? 'null' : typeof value;
};

export const isSensitiveField = (path: string, schema: JsonSchema) =>
  schema.writeOnly === true ||
  /(?:api[_-]?key|token|password|secret|credential|authorization)/i.test(path);

export const formatConfigValue = (value: unknown) =>
  typeof value === 'string' ? value : (JSON.stringify(value, null, 2) ?? '');
