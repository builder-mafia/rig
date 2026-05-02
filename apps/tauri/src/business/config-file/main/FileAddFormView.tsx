import { Button } from '@allin/ui';
import { CreateFormPathSectionView } from './CreateFormPathSectionView';

export const FileAddFormView = () => {
  return (
    <div className='h-full flex items-center justify-center p-6'>
      <div className='w-full max-w-xl rounded-xl border bg-card p-6 flex flex-col gap-4'>
        <div>
          <h2 className='text-lg font-semibold'>Add Settings Entry</h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Register a local file or folder and browse it from the sidebar.
          </p>
        </div>
        <div className='flex flex-col gap-2'>
          <label className='text-sm font-medium' htmlFor='config-file-name'>
            Name
          </label>
        </div>
        {/* <CreateFormPathSectionView
          isDirectory={context.newIsDirectory}
          path={context.newPath}
          isPickingPath={context.isPickingPath}
          onChangePath={context.setNewPath}
          onBrowsePath={() => {
            void context.pickPath();
          }}
        /> */}
        <div className='flex items-center justify-end gap-2 pt-2'>
          <Button type='button'>Add</Button>
        </div>
      </div>
    </div>
  );
};
