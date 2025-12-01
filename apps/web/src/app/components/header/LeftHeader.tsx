import { useSetAtom } from 'jotai';
import { SidebarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { leftPanelAtoms } from '../left-panel/left-panel-store';

export const LeftHeader = () => {
  const setIsSidebarOpen = useSetAtom(leftPanelAtoms.isOpen);

  return (
    // LeftPanel Sidebar has z-10, so we need to set z-20 to make it above the LeftPanel Sidebar.
    <div className='fixed top-1 left-2 flex z-20'>
      <Button
        variant={'outline'}
        size={'icon'}
        onClick={() => setIsSidebarOpen(prev => !prev)}
      >
        <SidebarIcon />
      </Button>
    </div>
  );
};
