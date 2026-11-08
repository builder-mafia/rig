import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useI18n } from '@/lib/preferences';
import { getConfigFields } from '../schema';
import type { ConfigDocument, JsonSchema, SaveConfigEdit } from '../types';
import { ConfigProperty, type PropertyEditor } from './ConfigProperty';

export const ConfigProperties = ({
  schema,
  value,
  format,
  revision,
  reading,
  save,
  reload,
  onEditingChange,
}: {
  schema: JsonSchema;
  value: unknown;
  format: ConfigDocument['format'];
  revision: string | null;
  reading: boolean;
  save: SaveConfigEdit;
  reload: () => void;
  onEditingChange: (active: boolean) => void;
}) => {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [configuredOnly, setConfiguredOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [activeRow, setActiveRow] = useState<string | null>(null);
  const start = useCallback(
    (row: string) => {
      setActiveRow(row);
      onEditingChange(true);
    },
    [onEditingChange],
  );
  const close = useCallback(() => {
    setActiveRow(null);
    onEditingChange(false);
  }, [onEditingChange]);
  const editor = useMemo<PropertyEditor>(
    () => ({
      activeRow,
      start,
      close,
      revision,
      format,
      reading,
      save,
      reload,
    }),
    [activeRow, start, close, revision, format, reading, save, reload],
  );
  const query = useDeferredValue(search.trim().toLocaleLowerCase());
  const fields = useMemo(
    () => getConfigFields(schema, schema, value),
    [schema, value],
  );
  const visible = useMemo(
    () =>
      fields.filter(
        field =>
          (!configuredOnly || field.configured) &&
          (!query ||
            `${field.key} ${field.schema.description ?? ''}`
              .toLocaleLowerCase()
              .includes(query)),
      ),
    [fields, query, configuredOnly],
  );
  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='flex shrink-0 flex-wrap items-center gap-3 border-b border-border/60 px-5 py-3'>
        <label className='flex min-w-40 flex-1 items-center gap-2 rounded-md border border-border px-2.5'>
          <Search size={13} className='shrink-0 text-muted-foreground' />
          <input
            type='search'
            aria-label={t('Search properties')}
            placeholder={t('Search properties')}
            value={search}
            disabled={activeRow !== null}
            onChange={event => {
              setSearch(event.target.value);
              setPage(1);
            }}
            autoCapitalize='none'
            autoCorrect='off'
            autoComplete='off'
            spellCheck={false}
            {...{ writingsuggestions: 'false' }}
            className='h-8 w-full bg-transparent text-xs outline-none'
          />
        </label>
        <label className='flex items-center gap-1.5 text-xs text-muted-foreground'>
          <input
            type='checkbox'
            checked={configuredOnly}
            disabled={activeRow !== null}
            onChange={event => {
              setConfiguredOnly(event.target.checked);
              setPage(1);
            }}
          />
          {t('Configured only')}
        </label>
      </div>
      <div className='min-h-0 flex-1 overflow-auto'>
        <p className='border-b border-border/60 px-5 py-2 text-[11px] text-muted-foreground'>
          {t(
            'File values are shown as written. Environment and runtime overrides may differ.',
          )}
        </p>
        {visible.length > 0 && (
          <table
            className='w-full min-w-[540px] table-fixed text-xs'
            aria-label={t('Properties')}
          >
            <colgroup>
              <col className='w-[25%]' />
              <col className='w-[12%]' />
              <col className='w-[30%]' />
              <col />
            </colgroup>
            <thead className='sticky top-0 z-10 border-b border-border bg-background text-left text-[11px] text-muted-foreground'>
              <tr>
                <th scope='col' className='py-2 pl-3 pr-2 font-medium'>
                  {t('Property')}
                </th>
                <th scope='col' className='px-2 py-2 font-medium'>
                  {t('Type')}
                </th>
                <th scope='col' className='px-2 py-2 font-medium'>
                  {t('File value')}
                </th>
                <th scope='col' className='px-2 py-2 font-medium'>
                  {t('Description')}
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.slice(0, page * 50).map(field => (
                <ConfigProperty
                  key={field.key}
                  field={field}
                  root={schema}
                  editor={editor}
                />
              ))}
            </tbody>
          </table>
        )}
        {visible.length > page * 50 && (
          <button
            type='button'
            onClick={() => setPage(count => count + 1)}
            className='px-5 py-4 text-xs text-muted-foreground'
          >
            {t('Show more properties')}
          </button>
        )}
        {!visible.length && (
          <p className='p-5 text-sm text-muted-foreground'>
            {t('No matching properties.')}
          </p>
        )}
      </div>
    </div>
  );
};
