'use client';

import { FileJson2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import { useConfigFileWorkbench } from './ConfigFileWorkbenchProvider';
import { getLanguageFromPath } from './configFileWorkbenchUtils';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
});

type MonacoEditorBeforeMount = NonNullable<
  ComponentProps<typeof MonacoEditor>['beforeMount']
>;

const configureMonaco: MonacoEditorBeforeMount = monaco => {
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    allowComments: true,
    schemaRequest: 'ignore',
  });
};

export const ConfigFileContentView = () => {
  const {
    selectedConfigFile,
    selectedBrowserItem,
    isLoadingContent,
    editorValue,
    setEditorValue,
  } = useConfigFileWorkbench();

  const language = selectedBrowserItem?.path
    ? getLanguageFromPath(selectedBrowserItem.path)
    : 'json';

  if (!selectedConfigFile) {
    return (
      <div className='h-full flex items-center justify-center text-muted-foreground'>
        <div className='flex items-center gap-2'>
          <FileJson2 className='size-5' />
          <span>Pick a file or folder from the sidebar</span>
        </div>
      </div>
    );
  }

  if (selectedBrowserItem?.isDirectory) {
    return (
      <div className='h-full flex items-center justify-center text-muted-foreground'>
        <div className='text-center'>
          <p className='text-sm font-medium text-foreground'>Folder selected</p>
          <p className='mt-1 text-sm'>
            Choose a file inside this folder to start editing.
          </p>
        </div>
      </div>
    );
  }

  if (isLoadingContent) {
    return (
      <div className='h-full flex items-center justify-center text-muted-foreground'>
        Loading file...
      </div>
    );
  }

  return (
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
  );
};
