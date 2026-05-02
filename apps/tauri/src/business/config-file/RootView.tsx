'use client';

import { ScrollArea } from '@allin/ui';
import { ContentView } from './main/ContentView';
import { HeaderView } from './main/HeaderView';
import { SelectionProvider } from './SelectionContext';
import { SidebarView } from './sidebar/SidebarView';

export const RootView = () => {
  return (
    <SelectionProvider>
      <div className='flex h-dvh flex-col overflow-hidden'>
        <HeaderView />
        <div className='grid min-h-0 flex-1 w-full grid-cols-[360px_1fr] bg-background'>
          <SidebarView />
          <ScrollArea className='min-h-0 h-full'>
            <div className='h-full min-h-full'>
              <ContentView />
            </div>
          </ScrollArea>
        </div>
      </div>
    </SelectionProvider>
  );
};
