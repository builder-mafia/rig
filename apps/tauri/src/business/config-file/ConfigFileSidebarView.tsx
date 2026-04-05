import { Button } from '@allin/ui';
import { Plus } from 'lucide-react';
import { ConfigFileEntryListView } from './ConfigFileEntryListView';
import { useConfigFileWorkbenchPane } from './ConfigFileWorkbenchPaneState';

export const ConfigFileSidebarView = () => {
  const { setPane } = useConfigFileWorkbenchPane();

  return (
    <aside className='border-r bg-muted/10 flex flex-col'>
      <div className='p-3 border-b flex items-center justify-between gap-2'>
        <h1 className='text-sm font-semibold tracking-wide'>Settings Files</h1>
        <Button
          onClick={() => setPane('create-entry')}
          size='sm'
          variant='outline'
        >
          <Plus className='size-4' />
          Add
        </Button>
      </div>

      <div className='flex-1 overflow-y-auto p-2'>
        <ConfigFileEntryListView />
      </div>
    </aside>
  );
};
