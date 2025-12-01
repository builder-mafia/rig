import { useSetAtom } from 'jotai';
import { SidebarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { leftPanelAtoms } from '../left-panel/left-panel-store';

export const LeftHeader = () => {
  const setIsSidebarOpen = useSetAtom(leftPanelAtoms.isOpen);

  return (
    <div className='fixed top-1 left-2 flex '>
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
