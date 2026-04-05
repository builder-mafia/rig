'use client';

import { use } from 'react';
import { ConfigFileContentView } from './ConfigFileContentView';
import { ConfigFileCreateFormView } from './ConfigFileCreateFormView';
import { ConfigFileHeaderView } from './ConfigFileHeaderView';
import { ConfigFileSidebarView } from './ConfigFileSidebarView';
import {
  ConfigFileWorkbenchContext,
  ConfigFileWorkbenchProvider,
} from './ConfigFileWorkbenchProvider';

const ConfigFileWorkbenchMainView = () => {
  const context = use(ConfigFileWorkbenchContext);

  if (!context) {
    throw new Error(
      'ConfigFileWorkbenchMainView must be used within ConfigFileWorkbenchProvider',
    );
  }

  const { pane } = context;

  return pane === 'create-entry' ? (
    <ConfigFileCreateFormView />
  ) : (
    <ConfigFileContentView />
  );
};

export const ConfigFileWorkbenchView = () => {
  return (
    <ConfigFileWorkbenchProvider>
      <div className='h-dvh w-full grid grid-cols-[320px_1fr] bg-background'>
        <ConfigFileSidebarView />
        <section className='flex flex-col min-w-0'>
          <ConfigFileHeaderView />
          <div className='flex-1 min-h-0'>
            <ConfigFileWorkbenchMainView />
          </div>
        </section>
      </div>
    </ConfigFileWorkbenchProvider>
  );
};
