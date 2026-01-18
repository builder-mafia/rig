import { SidebarProvider } from '@allin/ui';
import { atom, useAtom } from 'jotai';
import { AnimatePresence } from 'motion/react';
import type { CSSProperties } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { COOKIES, setCookie } from '@/app/cookie';
import { HotKeyList } from '../hotkey/hotkey-list';
import { LeftPanel } from './LeftPanel';
import { leftPanelAtoms } from './left-panel-store';

const setLeftPanelCookieAtom = atom(get => {
  const isOpen = get(leftPanelAtoms.isOpen);
  setCookie(COOKIES.LEFT_PANEL_OPEN, isOpen ? 'true' : 'false');
});

export const LeftPanelRenderer = () => {
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useAtom(leftPanelAtoms.isOpen);
  useAtom(setLeftPanelCookieAtom);

  useHotkeys(HotKeyList.toggleLeftPanel.hotkey, () => {
    setIsLeftPanelOpen(prev => !prev);
  });

  return (
    <AnimatePresence>
      <div>
        <SidebarProvider
          open={isLeftPanelOpen}
          onOpenChange={setIsLeftPanelOpen}
          style={
            {
              '--sidebar-width': '360px',
            } as CSSProperties
          }
        >
          <LeftPanel />
        </SidebarProvider>
      </div>
    </AnimatePresence>
  );
};
