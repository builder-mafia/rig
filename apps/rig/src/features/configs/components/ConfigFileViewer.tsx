import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, FileCode2, RefreshCw } from 'lucide-react';
import { cn } from '@allin/ui';
import { useI18n } from '@/lib/preferences';
import {
  configErrorMessage,
  configPluginsQueryKey,
  readConfigFile,
  saveConfigFile,
} from '../api';
import { isRecord } from '../schema';
import type { ConfigDocument, ConfigPlugin, SaveConfigEdit } from '../types';
import { ConfigProperties } from './ConfigProperties';
import { ConfigSourceView } from './ConfigSourceView';

export const ConfigFileViewer = ({
  plugin,
  fileId,
  editing,
  onEditingChange,
}: {
  plugin: ConfigPlugin;
  fileId: string;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
}) => {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const pluginId = plugin.id;
  const file = plugin.files.find(candidate => candidate.id === fileId)!;
  const [tab, setTab] = useState<'properties' | 'source'>(
    file.hasSchema ? 'properties' : 'source',
  );
  // Config contents can contain credentials. Retain only the selected document, never inactive query entries.
  const query = useQuery({
    queryKey: ['config-file', pluginId, fileId],
    queryFn: () => readConfigFile(pluginId, fileId),
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const document = query.data;
  const properties =
    document?.schema &&
    !document.parseError &&
    (!document.exists || isRecord(document.value))
      ? document.schema
      : null;
  const save: SaveConfigEdit = useCallback(
    async (edit, revision) => {
      const key = ['config-file', pluginId, fileId];
      const existed = queryClient.getQueryData<ConfigDocument>(key)?.exists;
      const updated = await saveConfigFile(pluginId, fileId, edit, revision);
      queryClient.setQueryData(key, updated);
      if (!existed)
        void queryClient.invalidateQueries({ queryKey: configPluginsQueryKey });
    },
    [fileId, pluginId, queryClient],
  );
  const { refetch } = query;
  const reload = useCallback(() => {
    void refetch();
  }, [refetch]);
  return (
    <section
      className='flex min-h-0 min-w-0 flex-1 flex-col'
      aria-label={plugin.name}
    >
      <div className='flex shrink-0 items-center gap-3 border-b border-border/60 px-5 py-4'>
        <FileCode2 size={18} className='shrink-0 text-muted-foreground' />
        <div className='min-w-0 flex-1'>
          <h1 className='text-sm font-medium'>
            {plugin.name}
            <span className='mx-2 text-muted-foreground'>/</span>
            {file.label}
          </h1>
          <p
            title={document?.path ?? file.path}
            className='mt-1 truncate font-mono text-[11px] text-muted-foreground'
          >
            {document?.path ?? file.path}
          </p>
        </div>
        {plugin.homepage && (
          <a
            href={plugin.homepage}
            target='_blank'
            rel='noreferrer'
            aria-label={t('Open documentation')}
            className='rounded p-1.5 text-muted-foreground hover:bg-muted'
          >
            <ExternalLink size={14} />
          </a>
        )}
        <button
          type='button'
          disabled={editing || query.isFetching}
          onClick={reload}
          aria-label={t('Refresh configuration')}
          className='rounded p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-50'
        >
          <RefreshCw
            size={14}
            className={query.isFetching ? 'animate-spin' : ''}
          />
        </button>
      </div>
      {query.isPending ? (
        <p className='p-5 text-sm text-muted-foreground'>
          {t('Loading configuration…')}
        </p>
      ) : query.isError && !document ? (
        <div role='alert' className='p-5 text-sm'>
          <p>{t('Could not read configuration.')}</p>
          <p className='mt-2 text-xs text-muted-foreground'>
            {configErrorMessage(query.error)}
          </p>
        </div>
      ) : (
        document && (
          <>
            {query.isRefetchError && (
              <p
                role='alert'
                className='border-b border-border/60 px-5 py-2 text-xs text-destructive'
              >
                {configErrorMessage(query.error)}
              </p>
            )}
            {!document.exists && (
              <p
                role='status'
                className='border-b border-border/60 bg-muted/30 px-5 py-3 text-xs leading-5 text-muted-foreground'
              >
                {t(
                  'This file does not exist yet. Available properties are shown below.',
                )}
              </p>
            )}
            {document.parseError && (
              <p
                role='alert'
                className='border-b border-border/60 bg-amber-500/10 px-5 py-3 text-xs leading-5'
              >
                {t('This file could not be parsed. Fix the syntax in Source.')}
                <span className='ml-2'>{document.parseError}</span>
              </p>
            )}
            {properties && (
              <div
                role='tablist'
                aria-label={t('Configuration view')}
                className='flex shrink-0 gap-4 border-b border-border/60 px-5'
              >
                {(['properties', 'source'] as const).map(id => (
                  <button
                    key={id}
                    type='button'
                    role='tab'
                    aria-selected={tab === id}
                    disabled={editing && tab !== id}
                    onClick={() => setTab(id)}
                    className={cn(
                      'border-b-2 py-3 text-xs disabled:opacity-50',
                      tab === id
                        ? 'border-foreground text-foreground'
                        : 'border-transparent text-muted-foreground',
                    )}
                  >
                    {t(id === 'properties' ? 'Properties' : 'Source')}
                  </button>
                ))}
              </div>
            )}
            {properties && tab === 'properties' ? (
              <ConfigProperties
                schema={properties}
                value={document.value}
                format={document.format}
                revision={document.revision}
                reading={query.isFetching}
                save={save}
                reload={reload}
                onEditingChange={onEditingChange}
              />
            ) : (
              <ConfigSourceView
                content={document.content}
                revision={document.revision}
                format={document.format}
                reading={query.isFetching}
                save={save}
                reload={reload}
                onEditingChange={active => {
                  if (active) setTab('source');
                  onEditingChange(active);
                }}
              />
            )}
          </>
        )
      )}
    </section>
  );
};
