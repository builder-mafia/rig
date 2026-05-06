'use client';

import { useAtomValue } from 'jotai';
import { ServiceProvider } from '../ServiceContext';
import { AIEditProvider } from './main/ai-edit/AIEditContext';
import { ContentView } from './main/ContentView';
import { HeaderView } from './main/HeaderView';
import { RightDockView } from './right-dock/RightDockView';
import { isRightDockOpenAtom } from './rightDockAtom';
import { SelectionProvider } from './SelectionContext';
import { SidebarView } from './sidebar/SidebarView';

export const RootView = () => {
  const isRightDockOpen = useAtomValue(isRightDockOpenAtom);
  return (
    <ServiceProvider>
      <SelectionProvider>
        <AIEditProvider>
          <div className='flex h-dvh w-dvw flex-col overflow-hidden'>
            <HeaderView />
            <div className='flex min-h-0 min-w-0 flex-1 overflow-hidden bg-background'>
              <SidebarView />
              <ContentView />
              {isRightDockOpen && <RightDockView />}
            </div>
          </div>
        </AIEditProvider>
      </SelectionProvider>
    </ServiceProvider>
  );
};
