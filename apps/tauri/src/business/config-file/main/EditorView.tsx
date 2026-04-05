'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';

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

type Props = {
  language: string;
  value: string;
  isReadOnly?: boolean;
  onChange: (value: string) => void;
};

export const EditorView = ({
  language,
  value,
  isReadOnly = false,
  onChange,
}: Props) => {
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
