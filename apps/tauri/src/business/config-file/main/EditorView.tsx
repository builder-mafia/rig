'use client';

import type { Monaco } from '@monaco-editor/react';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
});

const configureMonaco = (monaco: Monaco) => {
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    allowComments: true,
    schemaRequest: 'ignore',
  });
};

type EditorViewProps = {
  language: string;
  value: string;
  isReadOnly?: boolean;
  onChange: (value: string) => void;
};

export const EditorView = ({
  language,
  value,
  isReadOnly = true,
  onChange,
}: EditorViewProps) => {
  return (
    <MonacoEditor
      height='100%'
      language={language}
      value={value}
      beforeMount={configureMonaco}
      onChange={nextValue => onChange(nextValue ?? '')}
      theme='vs'
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        tabSize: 2,
        insertSpaces: true,
        automaticLayout: true,
        readOnly: isReadOnly,
        domReadOnly: isReadOnly,
        renderValidationDecorations: 'on',
      }}
    />
  );
};
