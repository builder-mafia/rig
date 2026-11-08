import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { open } from '@tauri-apps/plugin-dialog';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  toast,
} from '@allin/ui';
import { Download, FilePlus2, Loader2, Trash2 } from 'lucide-react';
import { useI18n } from '@/lib/preferences';
import type { Message } from '@/lib/translations';
import {
  configErrorMessage,
  configPluginsQueryKey,
  importConfigPlugin,
  installConfigPlugin,
  previewConfigPlugin,
  removeConfigPlugin,
} from '../api';
import type { ConfigPlugin, PluginPreview } from '../types';
import { ConfigPluginIcon } from './ConfigPluginIcon';

export const ConfigPluginsDialog = ({
  plugins,
  open: visible,
  onOpenChange,
  onInstalled,
}: {
  plugins: ConfigPlugin[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstalled: (id: string) => void;
}) => {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    path: string;
    result: PluginPreview;
  } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const perform = async (id: string, action: () => Promise<void>) => {
    setBusy(id);
    setFailure(null);
    try {
      await action();
    } catch (error) {
      setFailure(configErrorMessage(error));
    } finally {
      setBusy(null);
    }
  };
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: configPluginsQueryKey });
  return (
    <Dialog
      open={visible}
      onOpenChange={value => {
        if (!busy) {
          onOpenChange(value);
          setPreview(null);
          setFailure(null);
        }
      }}
    >
      <DialogContent
        closeLabel={t('Close')}
        className={`max-h-[85dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-xl p-4 sm:p-6 ${preview ? 'sm:max-w-xl' : 'sm:max-w-5xl'}`}
      >
        <DialogHeader className='text-left'>
          <DialogTitle>{t('Configuration plugins')}</DialogTitle>
          <DialogDescription className='text-xs leading-5'>
            {t(
              'Add a viewer for your existing configuration files. Libraries are installed separately.',
            )}
          </DialogDescription>
        </DialogHeader>
        {failure && (
          <p
            role='alert'
            className='break-words rounded-md bg-destructive/10 p-3 text-xs text-destructive'
          >
            {failure}
          </p>
        )}
        {preview ? (
          <div className='space-y-4'>
            <p className='text-xs text-muted-foreground'>
              {t('Review plugin')}
            </p>
            <PluginReview plugin={preview.result.plugin} />
            <p className='text-xs leading-5 text-muted-foreground'>
              {t('You can open and edit the files listed above in Config Hub.')}
            </p>
            <div className='flex justify-end gap-2'>
              <Button
                size='sm'
                variant='outline'
                disabled={!!busy}
                onClick={() => setPreview(null)}
              >
                {t('Cancel')}
              </Button>
              <Button
                size='sm'
                disabled={!!busy}
                onClick={() =>
                  void perform('import', async () => {
                    const id = await importConfigPlugin(
                      preview.path,
                      preview.result.revision,
                    );
                    await refresh();
                    setPreview(null);
                    onInstalled(id);
                    onOpenChange(false);
                    toast.success(t('Configuration plugin added'));
                  })
                }
              >
                {busy && <Loader2 size={13} className='animate-spin' />}
                {t('Install plugin')}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className='grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-5'>
              {plugins.map(plugin => (
                <div
                  key={plugin.id}
                  className='relative flex min-h-32 min-w-0 flex-col items-center justify-center gap-2 rounded-lg border border-border/70 p-2 pt-7 text-center sm:p-3 sm:pt-7'
                >
                  <ConfigPluginIcon plugin={plugin} size={30} />
                  <PluginPurpose plugin={plugin} />
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='absolute top-1 right-1 size-7 text-muted-foreground'
                    title={t(
                      plugin.installed ? 'Remove plugin' : 'Install plugin',
                    )}
                    disabled={!!busy}
                    onClick={() =>
                      void perform(plugin.id, async () => {
                        if (plugin.installed) {
                          await removeConfigPlugin(plugin.id);
                          queryClient.removeQueries({
                            queryKey: ['config-file', plugin.id],
                          });
                        } else {
                          await installConfigPlugin(plugin.id);
                          onInstalled(plugin.id);
                        }
                        await refresh();
                      })
                    }
                    aria-label={t(
                      plugin.installed
                        ? 'Remove {name} plugin'
                        : 'Install {name} plugin',
                      { name: plugin.name },
                    )}
                  >
                    {busy === plugin.id ? (
                      <Loader2 size={13} className='animate-spin' />
                    ) : plugin.installed ? (
                      <Trash2 size={13} />
                    ) : (
                      <Download size={13} />
                    )}
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type='button'
              variant='outline'
              disabled={!!busy}
              onClick={() =>
                void perform('preview', async () => {
                  const path = await open({
                    multiple: false,
                    directory: false,
                    filters: [
                      { name: 'Rig config plugin', extensions: ['json'] },
                    ],
                  });
                  if (typeof path === 'string')
                    setPreview({
                      path,
                      result: await previewConfigPlugin(path),
                    });
                })
              }
              className='justify-self-end'
            >
              <FilePlus2 size={14} />
              {t('Import plugin manifest')}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

const builtinPurposes: Partial<Record<string, Message>> = {
  codex: 'Codex model, permissions, and MCP',
  'agent-browser': 'Browser launch, sessions, and proxy',
  zsh: 'Zsh startup, aliases, and environment',
  'claude-code': 'Claude Code model, permissions, and hooks',
  starship: 'Starship prompt and modules',
  'gemini-cli': 'Gemini CLI model, tools, and MCP',
};

const PluginPurpose = ({ plugin }: { plugin: ConfigPlugin }) => {
  const { t } = useI18n();
  const purpose = plugin.builtin ? builtinPurposes[plugin.id] : undefined;
  const label = purpose ? t(purpose) : plugin.description || plugin.name;
  return (
    <p title={label} className='line-clamp-2 break-words text-xs leading-4'>
      {label}
    </p>
  );
};

const PluginReview = ({ plugin }: { plugin: ConfigPlugin }) => {
  return (
    <div>
      <div className='flex items-start gap-3'>
        <ConfigPluginIcon plugin={plugin} />
        <div className='min-w-0 flex-1'>
          <p className='text-sm font-medium'>{plugin.name}</p>
          <PluginPurpose plugin={plugin} />
        </div>
      </div>
      <ul className='mt-3 space-y-1.5'>
        {plugin.files.map(file => (
          <li key={file.id} className='min-w-0 text-[11px]'>
            <code className='mt-1 block break-all'>{file.path}</code>
            {file.error && (
              <p className='mt-1 text-destructive'>{file.error}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
