import { Button } from '@/components/ui/button';
import { DB, DB_STORE } from '@/idb/db';

export const DevelopmentPanel = () => {
  return (
    <div className='flex flex-col gap-4 px-4'>
      <li className='list-none flex flex-col gap-2'>
        <Button
          className='w-1/2'
          variant='destructive'
          onClick={() => {
            DB.clearStore(DB_STORE.CHANNELS);
            DB.clearStore(DB_STORE.MESSAGES);
          }}
        >
          Delete Indexed DB
        </Button>
      </li>
    </div>
  );
};
