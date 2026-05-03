import { ScrollArea } from '@allin/ui';
import { FilesList } from './files-list/FilesList';

export const SidebarView = () => {
  return (
    <aside className='min-h-0 w-[360px] shrink-0 border-r bg-muted/10 flex flex-col'>
      <ScrollArea className='min-h-0 flex-1'>
        <FilesList />
      </ScrollArea>
    </aside>
  );
};
