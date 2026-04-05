'use client';

import { ConfigFileContentView } from './ConfigFileContentView';
import { ConfigFileHeaderView } from './ConfigFileHeaderView';
import { ConfigFileSidebarView } from './ConfigFileSidebarView';
import { ConfigFileWorkbenchProvider } from './ConfigFileWorkbenchProvider';

export const ConfigFileWorkbenchView = () => {
  return (
    <ConfigFileWorkbenchProvider>
      <div className='h-dvh w-full grid grid-cols-[320px_1fr] bg-background'>
        <ConfigFileSidebarView />
        <section className='flex flex-col min-w-0'>
          <ConfigFileHeaderView />
          <div className='flex-1 min-h-0'>
            <ConfigFileContentView />
          </div>
        </section>
      </div>
    </ConfigFileWorkbenchProvider>
  );
};
