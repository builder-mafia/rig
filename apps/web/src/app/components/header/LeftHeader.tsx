import { useSetAtom } from 'jotai';
import { SidebarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { sideBarAtoms } from '../sidebar/sideBarStore';

export const LeftHeader = () => {
  const setIsSidebarOpen = useSetAtom(sideBarAtoms.isSidebarOpenAtom);

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
