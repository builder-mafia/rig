'use client';

import { toast } from '@allin/ui';
import { confirm, open } from '@tauri-apps/plugin-dialog';
import type { ChangeEvent, ReactNode, RefObject } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { filter, fromEvent } from 'rxjs';
import type {
  ConfigDirectoryEntry,
  StorageConfigFile,
} from '@/lib/gateway/config-file/types';
import { useConfigFileWorkbenchPane } from './ConfigFileWorkbenchPaneState';
import type { ConfigBrowserItem } from './configFileWorkbenchTypes';
import {
  getIconUrl,
  getLanguageFromPath,
  getNameFromPath,
  toBrowserItem,
} from './configFileWorkbenchUtils';
import { useConfigFile } from './useConfigFile';

type ConfigFileWorkbenchContextValue = {
  configFiles: StorageConfigFile[];
  selectedConfigFile: StorageConfigFile | null;
  selectedBrowserItem: ConfigBrowserItem | null;
  selectedConfigFileId: string | null;
  selectedBrowserItemPath: string | null;
  directoryEntriesByPath: Record<string, ConfigDirectoryEntry[]>;
  expandedFolderPaths: Record<string, boolean>;
  loadingFolderPaths: Record<string, boolean>;
  isLoadingContent: boolean;
  isSaving: boolean;
  isDirty: boolean;
  isDarkMode: boolean;
  newName: string;
  newPath: string;
  newIsDirectory: boolean;
  newIconType: 'preset' | 'uploaded' | null;
  newIconValue: string | null;
  newIconDisplayUrl: string | null;
  isIconPopoverOpen: boolean;
  isPickingPath: boolean;
  iconUploadInputRef: RefObject<HTMLInputElement | null>;
  editorValue: string;
  language: string;
  activeDisplayName: string | null;
  activeDisplayPath: string | null;
  activeIsDirectory: boolean;
  isRootItemActive: boolean;
  selectedRootIconUrl: string | null;
  finderTargetPath: string | null;
  canSave: boolean;
  setNewName: (name: string) => void;
  setNewPath: (path: string) => void;
  setNewIsDirectory: (isDirectory: boolean) => void;
  setNewIconPopoverOpen: (isOpen: boolean) => void;
  setEditorValue: (value: string) => void;
  selectConfigFileEntry: (configFile: StorageConfigFile) => Promise<void>;
  selectDirectoryEntry: (
    root: StorageConfigFile,
    entry: ConfigDirectoryEntry,
  ) => Promise<void>;
  toggleDirectory: (path: string) => Promise<void>;
  createEntry: () => Promise<void>;
  uploadIcon: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  selectPresetIcon: (presetId: string) => void;
  clearIcon: () => void;
  pickPath: () => Promise<void>;
  removeSelectedEntry: () => Promise<void>;
  openInFinder: () => Promise<void>;
  saveActiveFile: () => Promise<void>;
};

const ConfigFileWorkbenchContext =
  createContext<ConfigFileWorkbenchContextValue | null>(null);

export const ConfigFileWorkbenchProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const {
    configFiles,
    selectedConfigFile,
    createConfigFile,
    selectConfigFile,
    deleteConfigFile,
    readConfigFile,
    writeConfigFile,
    openConfigFileFolder,
    listConfigDirectoryEntries,
  } = useConfigFile();
  const { pane, setPane } = useConfigFileWorkbenchPane();

  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPath, setNewPath] = useState('');
  const [newIsDirectory, setNewIsDirectory] = useState(false);
  const [newIconType, setNewIconType] = useState<'preset' | 'uploaded' | null>(
    null,
  );
  const [newIconValue, setNewIconValue] = useState<string | null>(null);
  const [editorValue, setEditorValue] = useState('');
  const [loadedValue, setLoadedValue] = useState('');
  const [isPickingPath, setIsPickingPath] = useState(false);
  const [isIconPopoverOpen, setIsIconPopoverOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedBrowserItem, setSelectedBrowserItem] =
    useState<ConfigBrowserItem | null>(null);
  const [expandedFolderPaths, setExpandedFolderPaths] = useState<
    Record<string, boolean>
  >({});
  const [loadingFolderPaths, setLoadingFolderPaths] = useState<
    Record<string, boolean>
  >({});
  const [directoryEntriesByPath, setDirectoryEntriesByPath] = useState<
    Record<string, ConfigDirectoryEntry[]>
  >({});
  const iconUploadInputRef = useRef<HTMLInputElement | null>(null);

  const isDirty = editorValue !== loadedValue;
  const activeEditorPath =
    selectedBrowserItem && !selectedBrowserItem.isDirectory
      ? selectedBrowserItem.path
      : null;
  const language = useMemo(
    () => (activeEditorPath ? getLanguageFromPath(activeEditorPath) : 'json'),
    [activeEditorPath],
  );
  const newIconDisplayUrl = useMemo(
    () => getIconUrl(newIconType, newIconValue, isDarkMode),
    [isDarkMode, newIconType, newIconValue],
  );
  const selectedRootIconUrl = useMemo(() => {
    if (!selectedConfigFile) {
      return null;
    }

    return getIconUrl(
      selectedConfigFile.iconType,
      selectedConfigFile.iconValue,
      isDarkMode,
    );
  }, [isDarkMode, selectedConfigFile]);
  const activeDisplayName = selectedBrowserItem?.name ?? null;
  const activeDisplayPath = selectedBrowserItem?.path ?? null;
  const activeIsDirectory = selectedBrowserItem?.isDirectory ?? false;
  const isRootItemActive =
    selectedBrowserItem?.path === selectedConfigFile?.path;
  const finderTargetPath =
    activeDisplayPath ?? selectedConfigFile?.path ?? null;
  const canSave = Boolean(
    activeEditorPath && isDirty && !isSaving && pane !== 'create-entry',
  );

  const loadDirectoryEntries = useCallback(
    async (path: string) => {
      setLoadingFolderPaths(prev => ({
        ...prev,
        [path]: true,
      }));

      try {
        const entries = await listConfigDirectoryEntries(path);
        setDirectoryEntriesByPath(prev => ({
          ...prev,
          [path]: entries,
        }));
      } finally {
        setLoadingFolderPaths(prev => ({
          ...prev,
          [path]: false,
        }));
      }
    },
    [listConfigDirectoryEntries],
  );

  const ensureDirectoryEntriesLoaded = useCallback(
    async (path: string) => {
      if (directoryEntriesByPath[path] || loadingFolderPaths[path]) {
        return;
      }

      await loadDirectoryEntries(path);
    },
    [directoryEntriesByPath, loadDirectoryEntries, loadingFolderPaths],
  );

  const confirmDiscardChanges = useCallback(async () => {
    if (!isDirty) {
      return true;
    }

    return confirm('Unsaved changes will be discarded. Continue?', {
      title: 'Discard changes',
      kind: 'warning',
      okLabel: 'Discard',
      cancelLabel: 'Cancel',
    });
  }, [isDirty]);

  const toggleDirectory = useCallback(
    async (path: string, shouldExpand?: boolean) => {
      let nextExpanded = false;

      setExpandedFolderPaths(prev => {
        nextExpanded = shouldExpand ?? !prev[path];
        if (prev[path] === nextExpanded) {
          return prev;
        }

        return {
          ...prev,
          [path]: nextExpanded,
        };
      });

      if (nextExpanded) {
        try {
          await ensureDirectoryEntriesLoaded(path);
        } catch (error) {
          toast.error(`Failed to load folder: ${String(error)}`, {
            position: 'top-center',
            duration: 10000,
            closeButton: true,
          });
        }
      }
    },
    [ensureDirectoryEntriesLoaded],
  );

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
    if (!selectedConfigFile) {
      setSelectedBrowserItem(null);
      return;
    }

    setSelectedBrowserItem(prev => {
      if (prev?.rootId === selectedConfigFile.id) {
        return prev;
      }

      return toBrowserItem(selectedConfigFile);
    });
  }, [selectedConfigFile]);

  useEffect(() => {
    if (!activeEditorPath) {
      setEditorValue('');
      setLoadedValue('');
      return;
    }

    setIsLoadingContent(true);
    readConfigFile(activeEditorPath)
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
  }, [activeEditorPath, readConfigFile]);

  const saveActiveFile = useCallback(async () => {
    if (!activeEditorPath || !selectedBrowserItem || !isDirty || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      await writeConfigFile(activeEditorPath, editorValue);
      setLoadedValue(editorValue);
      toast.success(`Saved ${selectedBrowserItem.name}`, {
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
  }, [
    activeEditorPath,
    editorValue,
    isDirty,
    isSaving,
    selectedBrowserItem,
    writeConfigFile,
  ]);

  useEffect(() => {
    const saveShortcut$ = fromEvent<KeyboardEvent>(window, 'keydown').pipe(
      filter(
        event =>
          (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's',
      ),
    );

    const subscription = saveShortcut$.subscribe(event => {
      event.preventDefault();
      void saveActiveFile();
    });

    return () => subscription.unsubscribe();
  }, [saveActiveFile]);

  const selectConfigFileEntry = useCallback(
    async (configFile: StorageConfigFile) => {
      const shouldContinue = await confirmDiscardChanges();
      if (!shouldContinue) {
        return;
      }

      setPane('content');
      selectConfigFile(configFile.id);

      if (configFile.isDirectory) {
        await toggleDirectory(configFile.path, true);
      }
    },
    [confirmDiscardChanges, selectConfigFile, setPane, toggleDirectory],
  );

  const selectDirectoryEntry = useCallback(
    async (root: StorageConfigFile, entry: ConfigDirectoryEntry) => {
      const shouldContinue = await confirmDiscardChanges();
      if (!shouldContinue) {
        return;
      }

      setPane('content');
      selectConfigFile(root.id);
      setSelectedBrowserItem({
        rootId: root.id,
        name: entry.name,
        path: entry.path,
        isDirectory: entry.isDirectory,
      });

      if (entry.isDirectory) {
        await toggleDirectory(entry.path, true);
      }
    },
    [confirmDiscardChanges, selectConfigFile, setPane, toggleDirectory],
  );

  const createEntry = useCallback(async () => {
    const name = newName.trim();
    const path = newPath.trim();

    if (!name || !path) {
      toast.error('Name and path are required', {
        position: 'top-center',
      });
      return;
    }

    try {
      await createConfigFile(
        name,
        path,
        newIsDirectory,
        newIconType,
        newIconValue,
      );
      setNewName('');
      setNewPath('');
      setNewIsDirectory(false);
      setNewIconType(null);
      setNewIconValue(null);
      setIsIconPopoverOpen(false);
      setPane('content');
      toast.success(`${newIsDirectory ? 'Folder' : 'File'} added`, {
        position: 'top-center',
      });
    } catch (error) {
      toast.error(`Failed to add entry: ${String(error)}`, {
        position: 'top-center',
        duration: 10000,
        closeButton: true,
      });
    }
  }, [
    createConfigFile,
    newIconType,
    newIconValue,
    newIsDirectory,
    newName,
    newPath,
    setPane,
  ]);

  const uploadIcon = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
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
    },
    [],
  );

  const selectPresetIcon = useCallback((presetId: string) => {
    setNewIconType('preset');
    setNewIconValue(presetId);
    setIsIconPopoverOpen(false);
  }, []);

  const clearIcon = useCallback(() => {
    setNewIconType(null);
    setNewIconValue(null);
    setIsIconPopoverOpen(false);
  }, []);

  const pickPath = useCallback(async () => {
    setIsPickingPath(true);
    try {
      const selected = await open({
        multiple: false,
        directory: newIsDirectory,
      });

      if (!selected || Array.isArray(selected)) {
        return;
      }

      setNewPath(selected);
      if (!newName.trim()) {
        setNewName(getNameFromPath(selected));
      }
    } catch (error) {
      toast.error(`Failed to open picker: ${String(error)}`, {
        position: 'top-center',
        duration: 10000,
        closeButton: true,
      });
    } finally {
      setIsPickingPath(false);
    }
  }, [newIsDirectory, newName]);

  const removeSelectedEntry = useCallback(async () => {
    if (!selectedConfigFile) {
      return;
    }

    const shouldDelete = await confirm(
      `Remove ${selectedConfigFile.name} from the list? ${
        selectedConfigFile.isDirectory ? 'Folder' : 'File'
      } will stay on disk.`,
      {
        title: 'Remove setting entry',
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
      toast.error(`Failed to remove entry: ${String(error)}`, {
        position: 'top-center',
        duration: 10000,
        closeButton: true,
      });
    }
  }, [deleteConfigFile, selectedConfigFile]);

  const openInFinder = useCallback(async () => {
    if (!finderTargetPath) {
      return;
    }

    try {
      await openConfigFileFolder(finderTargetPath);
    } catch (error) {
      toast.error(`Failed to open folder: ${String(error)}`, {
        position: 'top-center',
        duration: 10000,
        closeButton: true,
      });
    }
  }, [finderTargetPath, openConfigFileFolder]);

  const value = useMemo<ConfigFileWorkbenchContextValue>(
    () => ({
      configFiles,
      selectedConfigFile,
      selectedBrowserItem,
      selectedConfigFileId: selectedConfigFile?.id ?? null,
      selectedBrowserItemPath: selectedBrowserItem?.path ?? null,
      directoryEntriesByPath,
      expandedFolderPaths,
      loadingFolderPaths,
      isLoadingContent,
      isSaving,
      isDirty,
      isDarkMode,
      newName,
      newPath,
      newIsDirectory,
      newIconType,
      newIconValue,
      newIconDisplayUrl,
      isIconPopoverOpen,
      isPickingPath,
      iconUploadInputRef,
      editorValue,
      language,
      activeDisplayName,
      activeDisplayPath,
      activeIsDirectory,
      isRootItemActive,
      selectedRootIconUrl,
      finderTargetPath,
      canSave,
      setNewName,
      setNewPath,
      setNewIsDirectory,
      setNewIconPopoverOpen: setIsIconPopoverOpen,
      setEditorValue,
      selectConfigFileEntry,
      selectDirectoryEntry,
      toggleDirectory,
      createEntry,
      uploadIcon,
      selectPresetIcon,
      clearIcon,
      pickPath,
      removeSelectedEntry,
      openInFinder,
      saveActiveFile,
    }),
    [
      activeDisplayName,
      activeDisplayPath,
      activeIsDirectory,
      canSave,
      clearIcon,
      configFiles,
      createEntry,
      directoryEntriesByPath,
      editorValue,
      expandedFolderPaths,
      finderTargetPath,
      isDarkMode,
      isDirty,
      isIconPopoverOpen,
      isLoadingContent,
      isPickingPath,
      isRootItemActive,
      isSaving,
      language,
      loadingFolderPaths,
      newIconDisplayUrl,
      newIconType,
      newIconValue,
      newIsDirectory,
      newName,
      newPath,
      openInFinder,
      pickPath,
      removeSelectedEntry,
      saveActiveFile,
      selectConfigFileEntry,
      selectDirectoryEntry,
      selectPresetIcon,
      selectedBrowserItem,
      selectedConfigFile,
      selectedRootIconUrl,
      toggleDirectory,
      uploadIcon,
    ],
  );

  return (
    <ConfigFileWorkbenchContext.Provider value={value}>
      {children}
    </ConfigFileWorkbenchContext.Provider>
  );
};

export const useConfigFileWorkbench = () => {
  const context = useContext(ConfigFileWorkbenchContext);

  if (!context) {
    throw new Error(
      'useConfigFileWorkbench must be used within ConfigFileWorkbenchProvider',
    );
  }

  return context;
};
