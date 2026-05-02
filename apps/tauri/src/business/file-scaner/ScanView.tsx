import { useQuery } from '@tanstack/react-query';
import { ScanFileList } from './ScanFileList';
import { scanFile } from './scan-file';

export const ScanView = () => {
  const { data: files } = useQuery({
    queryKey: ['scan-file'],
    queryFn: () => scanFile(),
    initialData: [],
  });

  return (
    <div className='flex h-full w-full items-center justify-center px-6 py-10'>
      <div className='w-full max-w-6xl'>
        <ScanFileList files={files.filter(file => file.exists) ?? []} />
      </div>
    </div>
  );
};
