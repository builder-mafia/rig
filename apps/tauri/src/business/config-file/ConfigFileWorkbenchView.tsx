'use client';

import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  toast,
} from '@allin/ui';
import { confirm, open } from '@tauri-apps/plugin-dialog';
import { FileJson2, Plus, Save, Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import {
  type ChangeEvent,
  type ComponentProps,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { filter, fromEvent } from 'rxjs';
import type { StorageConfigFile } from '@/lib/gateway/config-file/types';
import {
  APPLICATION_ICON_PRESETS,
  getApplicationIconUrl,
} from './applicationIconPresets';
import { useConfigFile } from './useConfigFile';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
});

type MonacoEditorBeforeMount = NonNullable<
  ComponentProps<typeof MonacoEditor>['beforeMount']
>;

const getLanguageFromPath = (path: string) => {
  const lowerCasePath = path.toLowerCase();

  if (lowerCasePath.endsWith('.jsonc')) return 'json';
  if (lowerCasePath.endsWith('.json')) return 'json';
  if (lowerCasePath.endsWith('.yaml') || lowerCasePath.endsWith('.yml')) {
    return 'yaml';
  }
  if (lowerCasePath.endsWith('.toml')) return 'toml';
  if (lowerCasePath.endsWith('.zshrc') || lowerCasePath.endsWith('.sh')) {
    return 'shell';
  }
  if (lowerCasePath.endsWith('.md')) return 'markdown';
  return 'plaintext';
};

const configureMonaco: MonacoEditorBeforeMount = monaco => {
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    allowComments: true,
    schemaRequest: 'ignore',
  });
};

const getIconUrl = (
  iconType: StorageConfigFile['iconType'],
  iconValue: string | null,
  isDarkMode: boolean,
) => {
  if (!iconType || !iconValue) {
    return null;
  }

  if (iconType === 'uploaded') {
    return iconValue;
  }

  return getApplicationIconUrl(iconValue, isDarkMode);
};

export const ConfigFileWorkbenchView = () => {
  const {
    configFiles,
    selectedConfigFile,
    fetchConfigFiles,
    createConfigFile,
    selectConfigFile,
    deleteConfigFile,
    readConfigFile,
    writeConfigFile,
  } = useConfigFile();

  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPath, setNewPath] = useState('');
  const [newIconType, setNewIconType] = useState<'preset' | 'uploaded' | null>(
    null,
  );
  const [newIconValue, setNewIconValue] = useState<string | null>(null);
  const [editorValue, setEditorValue] = useState('');
  const [loadedValue, setLoadedValue] = useState('');
  const [isPickingPath, setIsPickingPath] = useState(false);
  const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const iconUploadInputRef = useRef<HTMLInputElement | null>(null);

  const isDirty = editorValue !== loadedValue;
  const language = useMemo(() => {
    if (!selectedConfigFile) {
      return 'json';
    }
    return getLanguageFromPath(selectedConfigFile.path);
  }, [selectedConfigFile]);
  const newIconDisplayUrl = useMemo(
    () => getIconUrl(newIconType, newIconValue, isDarkMode),
    [isDarkMode, newIconType, newIconValue],
  );
  const selectedIconUrl = useMemo(() => {
    if (!selectedConfigFile) {
      return null;
    }

    return getIconUrl(
      selectedConfigFile.iconType,
      selectedConfigFile.iconValue,
      isDarkMode,
    );
  }, [isDarkMode, selectedConfigFile]);

  useEffect(() => {
    const updateDarkMode = () => {
      const hasDarkClass = document.documentElement.classList.contains('dark');
      if (hasDarkClass) {
        setIsDarkMode(true);
        return;
      }

      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    };

    updateDarkMode();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => updateDarkMode();
    mediaQuery.addEventListener('change', handleChange);

    const observer = new MutationObserver(updateDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    fetchConfigFiles()
      .catch(error => {
        toast.error(`Failed to load config file list: ${String(error)}`, {
          position: 'top-center',
          duration: 10000,
          closeButton: true,
        });
      })
      .finally(() => {
        setIsLoadingList(false);
      });
  }, [fetchConfigFiles]);

  useEffect(() => {
    if (!selectedConfigFile) {
      setEditorValue('');
      setLoadedValue('');
      return;
    }

    setIsLoadingContent(true);
    readConfigFile(selectedConfigFile.path)
      .then(content => {
        setEditorValue(content);
        setLoadedValue(content);
      })
      .catch(error => {
        setEditorValue('');
        setLoadedValue('');
        toast.error(`Failed to load file: ${String(error)}`, {
          position: 'top-center',
          duration: 10000,
          closeButton: true,
        });
      })
      .finally(() => {
        setIsLoadingContent(false);
      });
  }, [readConfigFile, selectedConfigFile]);

  const handleSave = useCallback(async () => {
    if (!selectedConfigFile || !isDirty || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      await writeConfigFile(selectedConfigFile.path, editorValue);
      setLoadedValue(editorValue);
      toast.success(`Saved ${selectedConfigFile.name}`, {
        position: 'top-center',
        duration: 3000,
      });
    } catch (error) {
      toast.error(`Failed to save file: ${String(error)}`, {
        position: 'top-center',
        duration: 10000,
        closeButton: true,
      });
    } finally {
      setIsSaving(false);
    }
  }, [editorValue, isDirty, isSaving, selectedConfigFile, writeConfigFile]);

  useEffect(() => {
    const saveShortcut$ = fromEvent<KeyboardEvent>(window, 'keydown').pipe(
      filter(
        event =>
          (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's',
      ),
    );

    const subscription = saveShortcut$.subscribe(event => {
      event.preventDefault();
      void handleSave();
    });

    return () => subscription.unsubscribe();
  }, [handleSave]);

  const handleSelectConfigFile = async (configFile: StorageConfigFile) => {
    if (isDirty) {
      const shouldDiscard = await confirm(
        'Unsaved changes will be discarded. Continue?',
        {
          title: 'Discard changes',
          kind: 'warning',
          okLabel: 'Discard',
          cancelLabel: 'Cancel',
        },
      );
      if (!shouldDiscard) {
        return;
      }
    }

    setShowCreateForm(false);
    selectConfigFile(configFile.id);
  };

  const handleCreateConfigFile = async () => {
    const name = newName.trim();
    const path = newPath.trim();

    if (!name || !path) {
      toast.error('Name and path are required', {
        position: 'top-center',
      });
      return;
    }

    try {
      await createConfigFile(name, path, newIconType, newIconValue);
      setNewName('');
      setNewPath('');
      setNewIconType(null);
      setNewIconValue(null);
      setIsIconPopoverOpen(false);
      setShowCreateForm(false);
      toast.success('Config file added', {
        position: 'top-center',
      });
    } catch (error) {
      toast.error(`Failed to add config file: ${String(error)}`, {
        position: 'top-center',
        duration: 10000,
        closeButton: true,
      });
    }
  };

  const handleUploadIcon = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are supported', {
        position: 'top-center',
      });
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
          return;
        }
        reject(new Error('Failed to read icon file'));
      };
      reader.onerror = () =>
        reject(reader.error ?? new Error('Icon read failed'));
      reader.readAsDataURL(file);
    }).catch(error => {
      toast.error(`Failed to read icon: ${String(error)}`, {
        position: 'top-center',
      });
      return null;
    });

    if (!dataUrl) {
      return;
    }

    setNewIconType('uploaded');
    setNewIconValue(dataUrl);
    setIsIconPopoverOpen(false);
    event.target.value = '';
  };

  const handleSelectPresetIcon = (presetId: string) => {
    setNewIconType('preset');
    setNewIconValue(presetId);
    setIsIconPopoverOpen(false);
  };

  const handleClearIcon = () => {
    setNewIconType(null);
    setNewIconValue(null);
    setIsIconPopoverOpen(false);
  };

  const handlePickPath = async () => {
    setIsPickingPath(true);
    try {
      const selected = await open({
        multiple: false,
        directory: false,
      });

      if (!selected || Array.isArray(selected)) {
        return;
      }

      setNewPath(selected);

      if (!newName.trim()) {
        const fileName = selected.split('/').at(-1) ?? selected;
        setNewName(fileName);
      }
    } catch (error) {
      toast.error(`Failed to open file picker: ${String(error)}`, {
        position: 'top-center',
        duration: 10000,
        closeButton: true,
      });
    } finally {
      setIsPickingPath(false);
    }
  };

  const handleDeleteSelectedConfigFile = async () => {
    if (!selectedConfigFile) {
      return;
    }

    const shouldDelete = await confirm(
      `Delete ${selectedConfigFile.name} from list? File will stay on disk.`,
      {
        title: 'Remove config file',
        kind: 'warning',
        okLabel: 'Remove',
        cancelLabel: 'Cancel',
      },
    );

    if (!shouldDelete) {
      return;
    }

    try {
      await deleteConfigFile(selectedConfigFile.id);
      toast.success(`Removed ${selectedConfigFile.name}`, {
        position: 'top-center',
      });
    } catch (error) {
      toast.error(`Failed to remove config file: ${String(error)}`, {
        position: 'top-center',
        duration: 10000,
        closeButton: true,
      });
    }
  };

  return (
    <div className='h-dvh w-full grid grid-cols-[320px_1fr] bg-background'>
      <aside className='border-r bg-muted/10 flex flex-col'>
        <div className='p-3 border-b flex items-center justify-between gap-2'>
          <h1 className='text-sm font-semibold tracking-wide'>
            Settings Files
          </h1>
          <Button
            onClick={() => setShowCreateForm(true)}
            size='sm'
            variant='outline'
          >
            <Plus className='size-4' />
            Add
          </Button>
        </div>

        <div className='flex-1 overflow-y-auto p-2'>
          {isLoadingList ? (
            <p className='text-sm text-muted-foreground px-2 py-1'>
              Loading...
            </p>
          ) : configFiles.length === 0 ? (
            <p className='text-sm text-muted-foreground px-2 py-1'>
              Add your first config file.
            </p>
          ) : (
            <ul className='flex flex-col gap-1'>
              {configFiles.map(configFile => {
                const isSelected = selectedConfigFile?.id === configFile.id;
                const iconUrl = getIconUrl(
                  configFile.iconType,
                  configFile.iconValue,
                  isDarkMode,
                );

                return (
                  <li key={configFile.id}>
                    <button
                      type='button'
                      className={`w-full rounded-md px-2 py-2 text-left transition-colors ${
                        isSelected
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => void handleSelectConfigFile(configFile)}
                    >
                      <div className='flex items-center gap-2'>
                        <span className='size-5 inline-flex items-center justify-center text-sm rounded-sm overflow-hidden'>
                          {iconUrl ? (
                            <img
                              src={iconUrl}
                              alt='icon'
                              className='size-5 rounded-sm object-cover border'
                            />
                          ) : (
                            <FileJson2 className='size-4 text-muted-foreground' />
                          )}
                        </span>
                        <p className='text-sm font-medium truncate'>
                          {configFile.name}
                        </p>
                      </div>
                      <p className='text-xs text-muted-foreground truncate'>
                        {configFile.path}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <section className='flex flex-col min-w-0'>
        <div className='h-12 border-b px-4 flex items-center justify-between gap-2'>
          {showCreateForm ? (
            <div className='text-sm text-muted-foreground'>
              Add a config file
            </div>
          ) : selectedConfigFile ? (
            <div className='min-w-0 flex items-center gap-2'>
              <span className='size-6 inline-flex items-center justify-center text-base rounded-sm overflow-hidden'>
                {selectedIconUrl ? (
                  <img
                    src={selectedIconUrl}
                    alt='icon'
                    className='size-6 rounded-sm object-cover border'
                  />
                ) : (
                  <FileJson2 className='size-4 text-muted-foreground' />
                )}
              </span>
              <div className='min-w-0'>
                <p className='text-sm font-medium truncate'>
                  {selectedConfigFile.name}
                </p>
                <p className='text-xs text-muted-foreground truncate'>
                  {selectedConfigFile.path}
                </p>
              </div>
            </div>
          ) : (
            <div className='text-sm text-muted-foreground'>
              Select a file from the sidebar
            </div>
          )}

          <div className='flex items-center gap-2'>
            {!showCreateForm && isDirty && (
              <span className='text-xs text-amber-600 font-medium'>
                Unsaved
              </span>
            )}
            <Button
              onClick={() => void handleDeleteSelectedConfigFile()}
              size='sm'
              variant='outline'
              disabled={!selectedConfigFile || showCreateForm}
            >
              <Trash2 className='size-4' />
              Remove
            </Button>
            <Button
              onClick={() => void handleSave()}
              size='sm'
              disabled={
                !selectedConfigFile || !isDirty || isSaving || showCreateForm
              }
            >
              <Save className='size-4' />
              Save
            </Button>
          </div>
        </div>

        <div className='flex-1 min-h-0'>
          {showCreateForm ? (
            <div className='h-full flex items-center justify-center p-6'>
              <div className='w-full max-w-xl rounded-xl border bg-card p-6 flex flex-col gap-4'>
                <div>
                  <h2 className='text-lg font-semibold'>Add Config File</h2>
                  <p className='text-sm text-muted-foreground mt-1'>
                    Register a local settings file to manage it from sidebar.
                  </p>
                </div>

                <div className='flex flex-col gap-2'>
                  <span className='text-sm font-medium'>Icon</span>
                  <div className='flex items-center gap-2'>
                    <span className='size-10 rounded-md border bg-muted/30 inline-flex items-center justify-center overflow-hidden'>
                      {newIconType === 'uploaded' && newIconValue ? (
                        <img
                          src={newIconValue}
                          alt='selected icon'
                          className='size-full object-cover'
                        />
                      ) : newIconDisplayUrl ? (
                        <img
                          src={newIconDisplayUrl}
                          alt='selected icon'
                          className='size-full object-cover'
                        />
                      ) : (
                        <FileJson2 className='size-5 text-muted-foreground' />
                      )}
                    </span>

                    <Popover
                      open={isIconPopoverOpen}
                      onOpenChange={setIsIconPopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button type='button' variant='outline'>
                          Add Icon
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className='w-[320px] p-3' align='start'>
                        <div className='flex flex-col gap-3'>
                          <div className='flex items-center justify-between gap-2'>
                            <p className='text-sm font-medium'>Upload</p>
                            <Button
                              type='button'
                              size='sm'
                              variant='outline'
                              onClick={() =>
                                iconUploadInputRef.current?.click()
                              }
                            >
                              Upload Image
                            </Button>
                            <input
                              ref={iconUploadInputRef}
                              type='file'
                              accept='image/*'
                              className='hidden'
                              onChange={event => void handleUploadIcon(event)}
                            />
                          </div>

                          <div className='h-px bg-border' />

                          <div className='flex flex-col gap-2'>
                            <p className='text-sm font-medium'>Presets</p>
                            <div className='grid grid-cols-4 gap-2'>
                              {APPLICATION_ICON_PRESETS.map(preset => (
                                <button
                                  type='button'
                                  key={preset.id}
                                  title={preset.label}
                                  className={`h-10 rounded-md border text-lg transition-colors ${
                                    newIconType === 'preset' &&
                                    newIconValue === preset.id
                                      ? 'bg-accent border-accent-foreground/20'
                                      : 'hover:bg-muted'
                                  }`}
                                  onClick={() =>
                                    handleSelectPresetIcon(preset.id)
                                  }
                                >
                                  <img
                                    src={
                                      isDarkMode
                                        ? preset.darkIconUrl
                                        : preset.lightIconUrl
                                    }
                                    alt={preset.label}
                                    className='mx-auto size-6 object-contain'
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className='flex justify-end'>
                            <Button
                              type='button'
                              size='sm'
                              variant='ghost'
                              onClick={handleClearIcon}
                            >
                              Clear
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className='flex flex-col gap-2'>
                  <label
                    className='text-sm font-medium'
                    htmlFor='config-file-name'
                  >
                    Name
                  </label>
                  <Input
                    id='config-file-name'
                    placeholder='e.g. Zed Settings'
                    value={newName}
                    onChange={event => setNewName(event.target.value)}
                  />
                </div>

                <div className='flex flex-col gap-2'>
                  <label
                    className='text-sm font-medium'
                    htmlFor='config-file-path'
                  >
                    Path
                  </label>
                  <div className='flex items-center gap-2'>
                    <Input
                      id='config-file-path'
                      placeholder='e.g. ~/.config/zed/settings.json'
                      value={newPath}
                      onChange={event => setNewPath(event.target.value)}
                    />
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => void handlePickPath()}
                      disabled={isPickingPath}
                    >
                      {isPickingPath ? 'Opening...' : 'Browse'}
                    </Button>
                  </div>
                </div>

                <div className='flex items-center justify-end gap-2 pt-2'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type='button'
                    onClick={() => void handleCreateConfigFile()}
                  >
                    Add File
                  </Button>
                </div>
              </div>
            </div>
          ) : !selectedConfigFile ? (
            <div className='h-full flex items-center justify-center text-muted-foreground'>
              <div className='flex items-center gap-2'>
                <FileJson2 className='size-5' />
                <span>Pick a config file to start editing</span>
              </div>
            </div>
          ) : isLoadingContent ? (
            <div className='h-full flex items-center justify-center text-muted-foreground'>
              Loading file...
            </div>
          ) : (
            <MonacoEditor
              height='100%'
              language={language}
              value={editorValue}
              beforeMount={configureMonaco}
              onChange={value => setEditorValue(value ?? '')}
              theme='vs'
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                tabSize: 2,
                insertSpaces: true,
                automaticLayout: true,
                renderValidationDecorations: 'on',
              }}
            />
          )}
        </div>
      </section>
    </div>
  );
};
