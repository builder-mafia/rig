'use client';

import { useAtomValue } from 'jotai';
import { Suspense } from 'react';
import { match } from 'ts-pattern';
import { ScanView } from '@/business/file-scaner/ScanView';
import { contentTypeAtom } from '../contentTypeAtom';
import { useSelectionContext } from '../SelectionContext';
import { EmptyPaneView } from './EmptyPaneView';
import { FileAddFormView } from './FileAddFormView';
import { FileEditorView } from './FileEditorView';

export const ContentView = () => {
  const contentType = useAtomValue(contentTypeAtom);
  const { selectedFile } = useSelectionContext();

  return match(contentType)
    .when(
      type => type === 'content' && selectedFile,
      () => (
        <Suspense
          fallback={
            <EmptyPaneView title='Loading' description='Loading file...' />
          }
        >
          <FileEditorView selectedFile={selectedFile!} />
        </Suspense>
      ),
    )
    .with('new-user', () => <ScanView />)
    .when(
      type => type === 'create-entry',
      () => <FileAddFormView />,
    )
    .otherwise(() => null);
};
