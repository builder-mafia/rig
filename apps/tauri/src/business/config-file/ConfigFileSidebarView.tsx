import { Button } from '@allin/ui';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import type { StorageConfigFile } from '@/lib/gateway/config-file/types';
import { ConfigFileEntryIconView } from './ConfigFileEntryIconView';
import { useConfigFileWorkbench } from './ConfigFileWorkbenchProvider';
import { getIconUrl, toBrowserItem } from './configFileWorkbenchUtils';

export const ConfigFileSidebarView = () => {
  const {
    configFiles,
    selectedConfigFileId,
    selectedBrowserItemPath,
    isLoadingList,
    isDarkMode,
    expandedFolderPaths,
    loadingFolderPaths,
    directoryEntriesByPath,
    setShowCreateForm,
    selectConfigFileEntry,
    selectDirectoryEntry,
    toggleDirectory,
  } = useConfigFileWorkbench();

  const renderDirectoryTree = (
    root: StorageConfigFile,
    directoryPath: string,
    depth: number,
  ): ReactNode => {
    const entries = directoryEntriesByPath[directoryPath] ?? [];

    return entries.map(entry => {
      const isExpanded = expandedFolderPaths[entry.path] ?? false;
      const isSelected = selectedBrowserItemPath === entry.path;

      return (
        <div key={entry.path}>
          <div
            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
              isSelected
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-muted/50'
            }`}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
          >
            <button
              type='button'
              className='inline-flex size-4 shrink-0 items-center justify-center rounded-sm hover:bg-black/5'
              onClick={event => {
                event.stopPropagation();
                if (!entry.isDirectory) {
                  return;
                }
                void toggleDirectory(entry.path);
              }}
            >
              {entry.isDirectory ? (
                isExpanded ? (
                  <ChevronDown className='size-4 text-muted-foreground' />
                ) : (
                  <ChevronRight className='size-4 text-muted-foreground' />
                )
              ) : null}
            </button>
            <button
              type='button'
              className='flex min-w-0 flex-1 items-center gap-2 text-left'
              onClick={() => {
                void selectDirectoryEntry(root, entry);
              }}
            >
              <span className='inline-flex size-4 shrink-0 items-center justify-center'>
                <ConfigFileEntryIconView isDirectory={entry.isDirectory} />
              </span>
              <span className='min-w-0 truncate'>{entry.name}</span>
            </button>
          </div>

          {entry.isDirectory &&
            isExpanded &&
            loadingFolderPaths[entry.path] && (
              <p
                className='px-2 py-1 text-xs text-muted-foreground'
                style={{ paddingLeft: `${44 + depth * 16}px` }}
              >
                Loading...
              </p>
            )}

          {entry.isDirectory &&
            isExpanded &&
            renderDirectoryTree(root, entry.path, depth + 1)}
        </div>
      );
    });
  };

  return (
    <aside className='border-r bg-muted/10 flex flex-col'>
      <div className='p-3 border-b flex items-center justify-between gap-2'>
        <h1 className='text-sm font-semibold tracking-wide'>Settings Files</h1>
        <Button
          // onClick 입력했을때 context 의 set 함수를 호출하여 state 를 바꾸는 게 아니라,
          // 메인 화면에 어떤 타입의 UI 를 렌더링 하고 있는지 설정하는 atom 을 만들고, 그 아톰을 메인 UI 에서 보고 있다가
          // 세팅 추가하는 UI 를 보이도록 만든다.
          onClick={() => setShowCreateForm(true)}
          size='sm'
          variant='outline'
        >
          <Plus className='size-4' />
          Add
        </Button>
      </div>

      <div className='flex-1 overflow-y-auto p-2'>
        {/*isLoadingList 를 context 에서 가져오는게 아니라, */}
        {/*이 컴포넌트 내부에서 바로 데이터를 fetch 해오고 그 loading 상태를 사용하면 될 것 같다.*/}
        {/*react-query 를 쓰면 isLoading 관리를 알아서 해주니 편할 것 같음. (이 부분은 선택사항)*/}
        {isLoadingList ? (
          <p className='text-sm text-muted-foreground px-2 py-1'>Loading...</p>
        ) : configFiles.length === 0 ? (
          // 그럼 자연스럽게 configFiles 도 context 에서 가져오는게 아니라 이 컴포넌트 안에서 가져와서 바로 쓰면 됨.
          // 또한 다시 생각해보니 이 로직과 컴포넌트를 분리하자. EntryList 라는 컴포넌트를 만들고
          // 그 컴포넌트 내부에서 fetch 해오면 될 것 같다.
          // 그리고 Suspense 로 감싸게 되면 알아서 로딩 처리가 될 테니깐.
          <p className='text-sm text-muted-foreground px-2 py-1'>
            Add your first file or folder.
          </p>
        ) : (
          <div className='flex flex-col gap-1'>
            {configFiles.map(configFile => {
              const rootItem = toBrowserItem(configFile);
              // 굳이 toBrowserItem 으로 바꿀필요가 없다. 그냥 configFile 타입 쓰면 된다. 왜냐면 ConfigFile 이 더 넓은 타입이니깐.
              // 그리고 아래 item 별로 로직은 EntryItem 이라는 컴포넌트로 분리하자. 그게 유지보수 하기 편하다.
              // 그 안에서 FileItem, DirectoryItem 으로 분리하면 된다.
              const isRootSelected = selectedConfigFileId === configFile.id;
              const isExpanded = expandedFolderPaths[configFile.path] ?? false;
              const iconUrl = getIconUrl(
                configFile.iconType,
                configFile.iconValue,
                isDarkMode,
              );

              return (
                <div key={configFile.id} className='rounded-md'>
                  <div
                    className={`flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors ${
                      isRootSelected
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <button
                      type='button'
                      className='mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-sm hover:bg-black/5'
                      onClick={event => {
                        event.stopPropagation();
                        if (!configFile.isDirectory) {
                          return;
                        }
                        void toggleDirectory(configFile.path);
                      }}
                    >
                      {configFile.isDirectory ? (
                        isExpanded ? (
                          <ChevronDown className='size-4 text-muted-foreground' />
                        ) : (
                          <ChevronRight className='size-4 text-muted-foreground' />
                        )
                      ) : null}
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
                          isDirectory={rootItem.isDirectory}
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

                  {configFile.isDirectory && isExpanded && (
                    <div className='pb-1'>
                      {loadingFolderPaths[configFile.path] ? (
                        <p className='px-2 py-1 text-xs text-muted-foreground pl-10'>
                          Loading...
                        </p>
                      ) : (
                        renderDirectoryTree(configFile, configFile.path, 1)
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};
