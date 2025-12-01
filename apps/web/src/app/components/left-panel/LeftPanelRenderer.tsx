import { useAtom } from 'jotai';
import { AnimatePresence } from 'motion/react';
import { useHotkeys } from 'react-hotkeys-hook';
import { HotKeyList } from '../hotkey/hotkey-list';
import { LeftPanel } from './LeftPanel';
import { leftPanelAtoms } from './left-panel-store';

export const LeftPanelRenderer = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useAtom(leftPanelAtoms.isOpen);

  useHotkeys(HotKeyList.toggleSidebar.hotkey, () => {
    setIsSidebarOpen(prev => !prev);
  });

  return <AnimatePresence>{isSidebarOpen && <LeftPanel />}</AnimatePresence>;
};
