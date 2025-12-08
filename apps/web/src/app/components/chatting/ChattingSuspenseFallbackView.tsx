import { Skeleton } from '@/components/ui/skeleton';

export const ChattingSuspenseFallbackView = () => {
  return (
    <div className='w-full h-full flex flex-col gap-6 p-20 max-w-2xl lg:max-w-4xl mx-auto overflow-y-hidden'>
      <Skeleton className='w-80 h-10 rounded-2xl self-end shrink-0' />
      <Skeleton className='w-full h-200 rounded-2xl shrink-0' />
      <Skeleton className='w-80 h-10 rounded-2xl self-end shrink-0 mt-8' />
      <Skeleton className='w-full h-200 rounded-2xl shrink-0' />
    </div>
  );
};
