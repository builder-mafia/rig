'use client';

import { ConfigFileContentView } from './ConfigFileContentView';
import { ConfigFileCreateFormView } from './ConfigFileCreateFormView';
import { ConfigFileHeaderView } from './ConfigFileHeaderView';
import { ConfigFileSidebarView } from './ConfigFileSidebarView';
import { useConfigFileWorkbenchPane } from './ConfigFileWorkbenchPaneState';
import { ConfigFileWorkbenchProvider } from './ConfigFileWorkbenchProvider';

const ConfigFileWorkbenchMainView = () => {
  const { pane } = useConfigFileWorkbenchPane();

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
