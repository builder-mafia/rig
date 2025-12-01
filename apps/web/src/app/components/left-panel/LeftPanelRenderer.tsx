import { useAtom } from 'jotai';
import { AnimatePresence } from 'motion/react';
import type { CSSProperties } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { SidebarProvider } from '@/components/ui/sidebar';
import { HotKeyList } from '../hotkey/hotkey-list';
import { LeftPanel } from './LeftPanel';
import { leftPanelAtoms } from './left-panel-store';

export const LeftPanelRenderer = () => {
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useAtom(leftPanelAtoms.isOpen);

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
