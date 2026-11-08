import { memo, useMemo, useState } from 'react';
import { ChevronRight, Eye, EyeOff, Pencil } from 'lucide-react';
import { useI18n } from '@/lib/preferences';
import {
  fieldType,
  formatConfigValue,
  getConfigFields,
  isRecord,
  isSensitiveField,
  resolveSchema,
  type ConfigField,
} from '../schema';
import type {
  ConfigDocument,
  ConfigPath,
  JsonSchema,
  SaveConfigEdit,
} from '../types';
import { ConfigValueEditor } from './ConfigValueEditor';

export interface PropertyEditor {
  activeRow: string | null;
  start: (row: string) => void;
  close: () => void;
  revision: string | null;
  format: ConfigDocument['format'];
  save: SaveConfigEdit;
  reload: () => void;
  reading: boolean;
}

const rootPath: ConfigPath = [];

export const ConfigProperty = memo(function ConfigProperty({
  field,
  root,
  parentPath = rootPath,
  segment = field.key,
  editor,
}: {
  field: ConfigField;
  root: JsonSchema;
  parentPath?: ConfigPath;
  segment?: string | number;
  editor: PropertyEditor;
}) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [limit, setLimit] = useState(50);
  const [revealed, setRevealed] = useState(false);
  const { schema, value, configured } = field;
  const path = useMemo(() => [...parentPath, segment], [parentPath, segment]);
  const row = JSON.stringify(path);
  const depth = path.length - 1;
  const sensitive = isSensitiveField(path.join('.'), schema);
  const hidden = sensitive && !revealed;
  const object = isRecord(value);
  const array = Array.isArray(value);
  const expandable =
    depth < 8 &&
    (!hidden || !configured) &&
    (object || array || (!configured && Boolean(schema.properties)));
  const editable =
    !object && !(editor.format === 'toml' && array && value.some(isRecord));
  const children = useMemo(() => {
    if (!expanded || !expandable) return [];
    if (!array) return getConfigFields(root, schema, value);
    return value.slice(0, limit).map(
      (item, index): ConfigField => ({
        key: String(index),
        schema: resolveSchema(root, schema.items, item),
        value: item,
        configured: true,
        required: false,
        known: Boolean(schema.items),
      }),
    );
  }, [array, expandable, expanded, limit, root, schema, value]);
  const hasMore = expanded && (array ? value.length : children.length) > limit;
  const description =
    schema.description ||
    t(
      field.known
        ? 'No description provided.'
        : 'Additional property; no schema description.',
    );
  const hasDefault = Object.prototype.hasOwnProperty.call(schema, 'default');
  const defaultValue = hasDefault ? formatConfigValue(schema.default) : '';
  const choices = schema.enum?.map(formatConfigValue) ?? [];
  const preview = !configured
    ? t('Not set')
    : hidden
      ? '••••••••'
      : object
        ? t('{count} properties', { count: Object.keys(value).length })
        : array
          ? t('{count} items', { count: value.length })
          : formatConfigValue(value);
  const type = fieldType(schema, value);
  return (
    <>
      <tr className='group border-b border-border/60 align-top hover:bg-muted/30'>
        <th
          scope='row'
          className='py-1.5 pr-2 text-left font-normal'
          style={{ paddingInlineStart: 10 + depth * 14 }}
        >
          <div className='flex h-6 min-w-0 items-center gap-1'>
            {expandable ? (
              <button
                type='button'
                aria-expanded={expanded}
                aria-label={t('Nested properties')}
                disabled={editor.activeRow !== null}
                onClick={() => setExpanded(open => !open)}
                className='shrink-0 rounded p-0.5 hover:bg-muted disabled:opacity-50'
              >
                <ChevronRight
                  size={13}
                  className={expanded ? 'rotate-90' : ''}
                />
              </button>
            ) : (
              <span className='w-[17px] shrink-0' />
            )}
            <code title={field.key} className='truncate text-xs font-medium'>
              {field.key}
            </code>
            {field.required && (
              <span
                title={t('Required')}
                aria-label={t('Required')}
                className='text-muted-foreground'
              >
                *
              </span>
            )}
          </div>
        </th>
        <td className='px-2 py-1.5'>
          <code
            title={type}
            className='block truncate rounded bg-muted px-1.5 py-1 text-[10px] text-muted-foreground'
          >
            {type}
          </code>
        </td>
        <td className='px-2 py-1.5'>
          {editor.activeRow === row ? (
            <ConfigValueEditor
              field={field}
              path={path}
              format={editor.format}
              revision={editor.revision}
              masked={hidden}
              save={editor.save}
              reload={editor.reload}
              close={editor.close}
            />
          ) : (
            <div className='flex h-6 min-w-0 items-center gap-1'>
              <button
                type='button'
                disabled={
                  !editable || editor.activeRow !== null || editor.reading
                }
                aria-label={t('Edit {name}', { name: field.key })}
                title={hidden ? undefined : preview}
                onClick={() => editor.start(row)}
                className='flex min-w-0 flex-1 items-center gap-1 rounded px-1 py-0.5 text-left enabled:hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none'
              >
                <code
                  className={
                    configured
                      ? 'min-w-0 flex-1 truncate text-xs'
                      : 'min-w-0 flex-1 truncate text-xs text-muted-foreground'
                  }
                >
                  {preview}
                </code>
                {editable && (
                  <Pencil
                    size={12}
                    className='shrink-0 text-muted-foreground'
                  />
                )}
              </button>
              {sensitive && configured && (
                <button
                  type='button'
                  aria-label={t(revealed ? 'Hide value' : 'Reveal value')}
                  onClick={() => setRevealed(show => !show)}
                  className='shrink-0 rounded p-1 text-muted-foreground hover:bg-muted'
                >
                  {revealed ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              )}
            </div>
          )}
        </td>
        <td className='px-2 py-1.5 text-[11px] leading-5 text-muted-foreground'>
          <p title={description} className='truncate'>
            {description}
          </p>
          {(hasDefault || choices.length > 0) && (
            <div className='flex min-w-0 gap-2 text-[10px] leading-4'>
              {hasDefault && (
                <span title={defaultValue} className='max-w-1/2 truncate'>
                  <span>{t('Schema default')}</span> <code>{defaultValue}</code>
                </span>
              )}
              {choices.length > 0 && (
                <span
                  aria-label={t('Allowed values')}
                  title={choices.join(', ')}
                  className='truncate'
                >
                  {choices.slice(0, 5).map((choice, index) => (
                    <code key={index} className='mr-1'>
                      {choice}
                    </code>
                  ))}
                  {choices.length > 5 && '…'}
                </span>
              )}
            </div>
          )}
        </td>
      </tr>
      {children.slice(0, limit).map((child, index) => (
        <ConfigProperty
          key={child.key}
          field={child}
          root={root}
          parentPath={path}
          segment={array ? index : child.key}
          editor={editor}
        />
      ))}
      {hasMore && (
        <tr>
          <td colSpan={4} className='px-5 py-1'>
            <button
              type='button'
              onClick={() => setLimit(count => count + 50)}
              className='text-xs text-muted-foreground hover:text-foreground'
            >
              {t('Show more properties')}
            </button>
          </td>
        </tr>
      )}
    </>
  );
});
