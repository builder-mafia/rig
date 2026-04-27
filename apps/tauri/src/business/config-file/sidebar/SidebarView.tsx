import { FilesList } from './files-list/FilesList';

export const SidebarView = () => {
  return (
    <aside className='border-r bg-muted/10 flex flex-col'>
      <div className='h-12 px-4 border-b flex items-center justify-between gap-2'></div>
      <FilesList />
    </aside>
  );
};
