'use client';

import { toast } from '@allin/ui';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  type MouseEvent,
  type ReactNode,
  use,
  useEffect,
  useState,
} from 'react';
import type {
  ConfigDirectoryEntry,
  StorageConfigFile,
} from '@/lib/gateway/config-file/types';
import { ConfigFileEntryIconView } from './ConfigFileEntryIconView';
import { ConfigFileWorkbenchContext } from './ConfigFileWorkbenchProvider';
import { getIconUrl } from './configFileWorkbenchUtils';
import { useConfigFile } from './useConfigFile';

type EntryRowProps = {
  children: ReactNode;
  isSelected: boolean;
  paddingLeft: number;
};

const EntryRow = ({ children, isSelected, paddingLeft }: EntryRowProps) => {
  return (
    <div
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
        isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50'
      }`}
      style={{ paddingLeft: `${paddingLeft}px` }}
    >
      {children}
    </div>
  );
};

type FileEntryItemViewProps = {
  name: string;
  isSelected: boolean;
  depth: number;
  onSelect: () => void;
};

const FileEntryItemView = ({
  name,
  isSelected,
  depth,
  onSelect,
}: FileEntryItemViewProps) => {
  return (
    <EntryRow isSelected={isSelected} paddingLeft={12 + depth * 16}>
      <span className='size-4 shrink-0' />
      <button
        type='button'
        className='flex min-w-0 flex-1 items-center gap-2 text-left'
        onClick={onSelect}
      >
        <span className='inline-flex size-4 shrink-0 items-center justify-center'>
          <ConfigFileEntryIconView isDirectory={false} />
        </span>
        <span className='min-w-0 truncate'>{name}</span>
      </button>
    </EntryRow>
  );
};

type DirectoryEntryItemViewProps = {
  name: string;
  isSelected: boolean;
  depth: number;
  isExpanded: boolean;
  isLoading: boolean;
  onToggle: (event: MouseEvent<HTMLButtonElement>) => void;
  onSelect: () => void;
  children?: ReactNode;
};

const DirectoryEntryItemView = ({
  name,
  isSelected,
  depth,
  isExpanded,
  isLoading,
  onToggle,
  onSelect,
  children,
}: DirectoryEntryItemViewProps) => {
  return (
    <div>
      <EntryRow isSelected={isSelected} paddingLeft={12 + depth * 16}>
        <button
          type='button'
          className='inline-flex size-4 shrink-0 items-center justify-center rounded-sm hover:bg-black/5'
          onClick={onToggle}
        >
          {isExpanded ? (
            <ChevronDown className='size-4 text-muted-foreground' />
          ) : (
            <ChevronRight className='size-4 text-muted-foreground' />
          )}
        </button>
        <button
          type='button'
          className='flex min-w-0 flex-1 items-center gap-2 text-left'
          onClick={onSelect}
        >
          <span className='inline-flex size-4 shrink-0 items-center justify-center'>
            <ConfigFileEntryIconView isDirectory />
          </span>
          <span className='min-w-0 truncate'>{name}</span>
        </button>
      </EntryRow>

      {isExpanded && isLoading ? (
        <p
          className='px-2 py-1 text-xs text-muted-foreground'
          style={{ paddingLeft: `${44 + depth * 16}px` }}
        >
          Loading...
        </p>
      ) : null}

      {isExpanded ? children : null}
    </div>
  );
};

type NestedEntryItemViewProps = {
  root: StorageConfigFile;
  entry: ConfigDirectoryEntry;
  depth: number;
};

const NestedEntryItemView = ({
  root,
  entry,
  depth,
}: NestedEntryItemViewProps) => {
  const context = use(ConfigFileWorkbenchContext);

  if (!context) {
    throw new Error(
      'NestedEntryItemView must be used within ConfigFileWorkbenchProvider',
    );
  }

  const {
    selectedBrowserItemPath,
    expandedFolderPaths,
    loadingFolderPaths,
    directoryEntriesByPath,
    selectDirectoryEntry,
    toggleDirectory,
  } = context;

  const isSelected = selectedBrowserItemPath === entry.path;

  if (!entry.isDirectory) {
    return (
      <FileEntryItemView
        name={entry.name}
        isSelected={isSelected}
        depth={depth}
        onSelect={() => {
          void selectDirectoryEntry(root, entry);
        }}
      />
    );
  }

  const isExpanded = expandedFolderPaths[entry.path] ?? false;
  const isLoading = loadingFolderPaths[entry.path] ?? false;
  const children = directoryEntriesByPath[entry.path] ?? [];

  return (
    <DirectoryEntryItemView
      name={entry.name}
      isSelected={isSelected}
      depth={depth}
      isExpanded={isExpanded}
      isLoading={isLoading}
      onToggle={event => {
        event.stopPropagation();
        void toggleDirectory(entry.path);
      }}
      onSelect={() => {
        void selectDirectoryEntry(root, entry);
      }}
    >
      {children.map(child => (
        <NestedEntryItemView
          key={child.path}
          root={root}
          entry={child}
          depth={depth + 1}
        />
      ))}
    </DirectoryEntryItemView>
  );
};

type RootEntryItemViewProps = {
  configFile: StorageConfigFile;
};

const RootEntryItemView = ({ configFile }: RootEntryItemViewProps) => {
  const context = use(ConfigFileWorkbenchContext);

  if (!context) {
    throw new Error(
      'RootEntryItemView must be used within ConfigFileWorkbenchProvider',
    );
  }

  const {
    selectedConfigFileId,
    isDarkMode,
    expandedFolderPaths,
    loadingFolderPaths,
    directoryEntriesByPath,
    selectConfigFileEntry,
    toggleDirectory,
  } = context;

  const isSelected = selectedConfigFileId === configFile.id;
  const iconUrl = getIconUrl(
    configFile.iconType,
    configFile.iconValue,
    isDarkMode,
  );

  if (!configFile.isDirectory) {
    return (
      <div className='rounded-md'>
        <div
          className={`flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors ${
            isSelected
              ? 'bg-accent text-accent-foreground'
              : 'hover:bg-muted/50'
          }`}
        >
          <span className='mt-0.5 size-4 shrink-0' />
          <button
            type='button'
            className='flex min-w-0 flex-1 items-start gap-2 text-left'
            onClick={() => {
              void selectConfigFileEntry(configFile);
            }}
          >
            <span className='mt-0.5 inline-flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-sm'>
              <ConfigFileEntryIconView
                isDirectory={configFile.isDirectory}
                iconUrl={iconUrl}
              />
            </span>
            <span className='min-w-0 flex-1'>
              <span className='block truncate text-sm font-medium'>
                {configFile.name}
              </span>
              <span className='block truncate text-xs text-muted-foreground'>
                {configFile.path}
              </span>
            </span>
          </button>
        </div>
      </div>
    );
  }

  const isExpanded = expandedFolderPaths[configFile.path] ?? false;
  const isLoading = loadingFolderPaths[configFile.path] ?? false;
  const children = directoryEntriesByPath[configFile.path] ?? [];

  return (
    <div className='rounded-md'>
      <div
        className={`flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors ${
          isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/50'
        }`}
      >
        <button
          type='button'
          className='mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-sm hover:bg-black/5'
          onClick={event => {
            event.stopPropagation();
            void toggleDirectory(configFile.path);
          }}
        >
          {isExpanded ? (
            <ChevronDown className='size-4 text-muted-foreground' />
          ) : (
            <ChevronRight className='size-4 text-muted-foreground' />
          )}
        </button>
        <button
          type='button'
          className='flex min-w-0 flex-1 items-start gap-2 text-left'
          onClick={() => {
            void selectConfigFileEntry(configFile);
          }}
        >
          <span className='mt-0.5 inline-flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-sm'>
            <ConfigFileEntryIconView
              isDirectory={configFile.isDirectory}
              iconUrl={iconUrl}
            />
          </span>
          <span className='min-w-0 flex-1'>
            <span className='block truncate text-sm font-medium'>
              {configFile.name}
            </span>
            <span className='block truncate text-xs text-muted-foreground'>
              {configFile.path}
            </span>
          </span>
        </button>
      </div>

      {isExpanded && isLoading ? (
        <p className='px-2 py-1 pl-10 text-xs text-muted-foreground'>
          Loading...
        </p>
      ) : null}

      {isExpanded ? (
        <div className='pb-1'>
          {children.map(entry => (
            <NestedEntryItemView
              key={entry.path}
              root={configFile}
              entry={entry}
              depth={1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export const ConfigFileEntryListView = () => {
  const { configFiles, fetchConfigFiles } = useConfigFile();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    fetchConfigFiles()
      .catch(error => {
        toast.error(`Failed to load config file list: ${String(error)}`, {
          position: 'top-center',
          duration: 10000,
          closeButton: true,
        });
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fetchConfigFiles]);

  if (isLoading) {
    return (
      <p className='px-2 py-1 text-sm text-muted-foreground'>Loading...</p>
    );
  }

  if (configFiles.length === 0) {
    return (
      <p className='px-2 py-1 text-sm text-muted-foreground'>
        Add your first file or folder.
      </p>
    );
  }

  return (
    <div className='flex flex-col gap-1'>
      {configFiles.map(configFile => (
        <RootEntryItemView key={configFile.id} configFile={configFile} />
      ))}
    </div>
  );
};
