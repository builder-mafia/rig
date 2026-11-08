import { describe, expect, it } from 'vitest';
import codexSchema from '../../../config-plugins/schemas/codex.schema.json';
import browserSchema from '../../../config-plugins/schemas/agent-browser.schema.json';
import claudeSchema from '../../../config-plugins/schemas/claude-code.schema.json';
import geminiSchema from '../../../config-plugins/schemas/gemini-cli.schema.json';
import starshipSchema from '../../../config-plugins/schemas/starship.schema.json';
import {
  fieldType,
  getConfigFields,
  isSensitiveField,
  resolveSchema,
} from './schema';
import { configDocumentSchema, type JsonSchema } from './types';

describe('configuration schema exploration', () => {
  it('preserves false, zero, null and undeclared file values separately from defaults', () => {
    const schema: JsonSchema = {
      properties: {
        enabled: { type: 'boolean', default: true },
        retries: { type: 'integer' },
        unset: { default: 'fallback' },
      },
    };
    const fields = getConfigFields(schema, schema, {
      enabled: false,
      retries: 0,
      extra: null,
    });
    expect(fields.find(field => field.key === 'enabled')).toMatchObject({
      configured: true,
      value: false,
      schema: { default: true },
    });
    expect(fields.find(field => field.key === 'retries')?.value).toBe(0);
    expect(fields.find(field => field.key === 'extra')).toMatchObject({
      configured: true,
      known: false,
      value: null,
    });
    expect(fields.find(field => field.key === 'unset')).toMatchObject({
      configured: false,
      value: undefined,
    });
  });

  it('resolves local refs, dynamic map entries and union allowed values', () => {
    const root: JsonSchema = {
      $defs: {
        mode: {
          anyOf: [{ const: 'safe', description: 'Safe' }, { const: 'full' }],
        },
        server: {
          properties: {
            command: { type: 'string', description: 'Executable name' },
          },
        },
      },
      properties: {
        mode: { $ref: '#/$defs/mode' },
        servers: {
          type: 'object',
          additionalProperties: { $ref: '#/$defs/server' },
        },
      },
    };
    const fields = getConfigFields(root, root, {
      mode: 'full',
      servers: { demo: { command: 'echo' } },
    });
    expect(fields[0].schema.enum).toEqual(['safe', 'full']);
    const servers = fields.find(field => field.key === 'servers')!;
    const entry = getConfigFields(root, servers.schema, servers.value)[0];
    expect(entry.known).toBe(true);
    expect(
      getConfigFields(root, entry.schema, entry.value)[0].schema.description,
    ).toBe('Executable name');
    expect(fieldType(resolveSchema(root, fields[0].schema), 'full')).toBe(
      'string',
    );
  });

  it('handles recursive and escaped JSON pointers without remote requests', () => {
    const root: JsonSchema = {
      $defs: {
        'a/b~c': { type: 'string' },
        recursive: { allOf: [{ $ref: '#/$defs/recursive' }] },
      },
    };
    expect(resolveSchema(root, { $ref: '#/$defs/a~1b~0c' }).type).toBe(
      'string',
    );
    expect(() =>
      resolveSchema(root, { $ref: '#/$defs/recursive' }),
    ).not.toThrow();
    expect(
      resolveSchema(root, { $ref: 'https://example.com/schema' }).properties,
    ).toBeUndefined();
    const scalar = resolveSchema(
      {},
      { allOf: [{ type: 'string', enum: ['a', 'b'] }] },
    );
    expect(scalar.type).toBe('string');
    expect(scalar.properties).toBeUndefined();
    const variant = resolveSchema(
      {},
      {
        oneOf: [
          {
            type: 'object',
            properties: {
              kind: { const: 'command' },
              command: { type: 'string' },
            },
          },
          {
            type: 'object',
            properties: { kind: { const: 'remote' }, url: { type: 'string' } },
          },
        ],
      },
      { kind: 'remote', url: 'https://example.com' },
    );
    expect(variant.properties?.url).toBeTruthy();
  });

  it('decodes both official schema snapshots and exposes real Codex and browser properties', () => {
    for (const schema of [codexSchema, browserSchema]) {
      const document = configDocumentSchema.parse({
        path: '/fixture',
        format: 'json',
        exists: true,
        content: '{}',
        value: {},
        schema,
        parseError: null,
        revision: 'fixture',
      });
      expect(
        getConfigFields(document.schema!, document.schema!, {}).length,
      ).toBeGreaterThan(40);
    }
    const normalized = configDocumentSchema.shape.schema.parse(codexSchema)!;
    const fields = getConfigFields(normalized, normalized, {
      approval_policy: 'on-request',
      mcp_servers: { fixture: { command: 'echo' } },
    });
    expect(
      fields.find(field => field.key === 'approval_policy')?.schema.enum,
    ).toContain('on-request');
    expect(
      fields.find(field => field.key === 'approval_policy')?.schema.enum,
    ).toContain('never');
    expect(
      fields.find(field => field.key === 'model')?.schema.description,
    ).toBeTruthy();
  });

  it('rejects malformed schema descriptions and identifies sensitive values', () => {
    expect(() =>
      configDocumentSchema.parse({
        path: '/fixture',
        format: 'json',
        exists: true,
        content: '{}',
        value: {},
        schema: { properties: { x: { description: {} } } },
        parseError: null,
        revision: null,
      }),
    ).toThrow();
    expect(isSensitiveField('providers.demo.api_key', {})).toBe(true);
    expect(isSensitiveField('credentials', {})).toBe(true);
    expect(isSensitiveField('anything', { writeOnly: true })).toBe(true);
    expect(isSensitiveField('model', {})).toBe(false);
  });

  it.each([
    {
      name: 'Claude Code',
      schema: claudeSchema,
      section: 'permissions',
      key: 'defaultMode',
      value: 'plan',
      type: 'string',
    },
    {
      name: 'Starship',
      schema: starshipSchema,
      section: 'git_branch',
      key: 'disabled',
      value: false,
      type: 'boolean',
    },
    {
      name: 'Gemini CLI',
      schema: geminiSchema,
      section: 'general',
      key: 'vimMode',
      value: true,
      type: 'boolean',
    },
  ])(
    'decodes the $name schema and finds an editable nested value',
    ({ schema, section, key, value, type }) => {
      const root = configDocumentSchema.shape.schema.parse(schema)!;
      const parent = getConfigFields(root, root, {
        [section]: { [key]: value },
      }).find(field => field.key === section)!;
      expect(
        getConfigFields(root, parent.schema, parent.value).find(
          field => field.key === key,
        ),
      ).toMatchObject({
        known: true,
        configured: true,
        value,
        schema: { type },
      });
    },
  );
});
