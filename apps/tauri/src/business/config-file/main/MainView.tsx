'use client';

import { Suspense, use } from 'react';
import { match } from 'ts-pattern';
import { ScanView } from '@/business/file-scaner/ScanView';
import { SelectionContext } from '../SelectionContext';
import { usePaneType } from '../usePaneType';
import { ContentView } from './ContentView';
import { EmptyPaneView } from './EmptyPaneView';
import { FileAddFormView } from './FileAddFormView';

export const MainView = () => {
  const { paneType } = usePaneType();
  const { selectedFile } = use(SelectionContext);

  return match(paneType)
    .when(
      type => type === 'content' && selectedFile,
      () => (
        <Suspense
          fallback={
            <EmptyPaneView title='Loading' description='Loading file...' />
          }
        >
          <ContentView selectedFile={selectedFile!} />
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
