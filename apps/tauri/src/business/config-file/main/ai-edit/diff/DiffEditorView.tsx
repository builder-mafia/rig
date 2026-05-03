'use client';

import type { Monaco } from '@monaco-editor/react';
import dynamic from 'next/dynamic';

const MonacoDiffEditor = dynamic(
  () => import('@monaco-editor/react').then(module => module.DiffEditor),
  { ssr: false },
);

const configureMonaco = (monaco: Monaco) => {
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    allowComments: true,
    schemaRequest: 'ignore',
  });
};

type DiffEditorViewProps = {
  language: string;
  original: string;
  modified: string;
};

export const DiffEditorView = ({
  language,
  original,
  modified,
}: DiffEditorViewProps) => {
  return (
    <MonacoDiffEditor
      height='100%'
      language={language}
      original={original}
      modified={modified}
      beforeMount={configureMonaco}
      theme='vs'
      options={{
        renderSideBySide: true,
        readOnly: true,
        originalEditable: false,
        minimap: { enabled: false },
        fontSize: 13,
        automaticLayout: true,
        renderValidationDecorations: 'off',
        renderOverviewRuler: false,
        scrollBeyondLastLine: false,
      }}
    />
  );
};
