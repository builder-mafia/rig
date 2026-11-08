import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button, cn } from '@allin/ui';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { useI18n } from '@/lib/preferences';
import {
  configErrorMessage,
  configPluginsQueryKey,
  listConfigPlugins,
} from '../api';
import type { ConfigPlugin } from '../types';
import { ConfigFileViewer } from './ConfigFileViewer';
import { ConfigPluginIcon } from './ConfigPluginIcon';
import { ConfigPluginsDialog } from './ConfigPluginsDialog';

export const ConfigHub = ({
  editing,
  onEditingChange,
}: {
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
}) => {
  const { t } = useI18n();
  const query = useQuery({
    queryKey: configPluginsQueryKey,
    queryFn: listConfigPlugins,
    retry: false,
    refetchOnWindowFocus: !editing,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const plugins = query.data ?? [];
  const installed = plugins.filter(plugin => plugin.installed);
  const selected =
    installed.find(plugin => plugin.id === selectedId) ?? installed[0];
  return (
    <div className='flex min-h-0 flex-1'>
      <aside
        className='flex w-64 shrink-0 flex-col border-r border-border/60'
        aria-label={t('Configuration plugins')}
      >
        <div className='flex h-14 shrink-0 items-center justify-between border-b border-border/60 px-4'>
          <h2 className='text-xs font-medium'>{t('Installed plugins')}</h2>
          <Button
            variant='ghost'
            size='icon'
            className='size-7'
            aria-label={t('Add config plugins')}
            disabled={editing || query.isPending || query.isError}
            onClick={() => setManageOpen(true)}
          >
            <Plus size={15} />
          </Button>
        </div>
        <div className='min-h-0 flex-1 space-y-1 overflow-auto p-2'>
          {installed.map(plugin => (
            <button
              type='button'
              key={plugin.id}
              aria-current={plugin.id === selected?.id ? 'page' : undefined}
              disabled={editing && plugin.id !== selected?.id}
              onClick={() => setSelectedId(plugin.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
                selected?.id === plugin.id ? 'bg-muted' : 'hover:bg-muted/50',
              )}
            >
              <ConfigPluginIcon plugin={plugin} size={17} />
              <span className='min-w-0 flex-1 truncate'>{plugin.name}</span>
            </button>
          ))}
          {!query.isPending && !query.isError && !installed.length && (
            <p className='px-3 py-4 text-xs leading-5 text-muted-foreground'>
              {t('Your configuration plugins will appear here.')}
            </p>
          )}
        </div>
        <Button
          variant='ghost'
          size='sm'
          disabled={editing || query.isPending || query.isError}
          className='m-3'
          onClick={() => setManageOpen(true)}
        >
          <Plus size={13} />
          {t('Add config plugins')}
        </Button>
      </aside>
      {query.isPending ? (
        <p className='p-6 text-sm text-muted-foreground'>
          {t('Loading configuration…')}
        </p>
      ) : query.isError && !query.data ? (
        <div role='alert' className='p-6 text-sm'>
          <p>{t('Could not load plugins.')}</p>
          <p className='mt-2 text-xs text-muted-foreground'>
            {configErrorMessage(query.error)}
          </p>
          <Button
            variant='outline'
            size='sm'
            className='mt-4'
            onClick={() => void query.refetch()}
          >
            {t('Retry')}
          </Button>
        </div>
      ) : selected ? (
        <PluginFiles
          key={selected.id}
          plugin={selected}
          editing={editing}
          onEditingChange={onEditingChange}
        />
      ) : (
        <div className='flex min-w-0 flex-1 flex-col items-center justify-center gap-4 p-8 text-center'>
          <span className='rounded-2xl bg-muted p-4'>
            <SlidersHorizontal size={28} className='text-muted-foreground' />
          </span>
          <div>
            <h1 className='text-lg font-medium'>{t('Config Hub')}</h1>
            <p className='mt-2 max-w-sm text-sm leading-6 text-muted-foreground'>
              {t(
                'Understand your tools, one configuration at a time. Add a plugin to browse files and discover available properties.',
              )}
            </p>
          </div>
          <div className='my-2 flex gap-3'>
            {plugins.slice(0, 3).map(plugin => (
              <ConfigPluginIcon key={plugin.id} plugin={plugin} size={24} />
            ))}
          </div>
          <Button onClick={() => setManageOpen(true)}>
            <Plus size={14} />
            {t('Add config plugins')}
          </Button>
        </div>
      )}
      <ConfigPluginsDialog
        plugins={plugins}
        open={manageOpen}
        onOpenChange={setManageOpen}
        onInstalled={setSelectedId}
      />
    </div>
  );
};

const PluginFiles = ({
  plugin,
  editing,
  onEditingChange,
}: {
  plugin: ConfigPlugin;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
}) => {
  const { t } = useI18n();
  const [fileId, setFileId] = useState(plugin.files[0].id);
  return (
    <div className='flex min-h-0 min-w-0 flex-1 flex-col'>
      {plugin.files.length > 1 && (
        <div className='flex shrink-0 items-center gap-3 border-b border-border/60 px-5 py-2 text-xs'>
          <label htmlFor='config-file-select'>{t('Configuration file')}</label>
          <select
            id='config-file-select'
            value={fileId}
            disabled={editing}
            onChange={event => setFileId(event.target.value)}
            className='max-w-full rounded-md border border-border bg-background px-2 py-1.5'
          >
            {plugin.files.map(file => (
              <option key={file.id} value={file.id}>
                {file.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <ConfigFileViewer
        key={fileId}
        plugin={plugin}
        fileId={fileId}
        editing={editing}
        onEditingChange={onEditingChange}
      />
    </div>
  );
};
