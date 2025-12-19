import { Skeleton } from '@allin/ui';

export const ChattingSuspenseFallbackView = () => {
  return (
    <div className='w-full h-full flex flex-col gap-6 p-20 max-w-2xl lg:max-w-4xl mx-auto overflow-y-hidden'>
      <Skeleton className='opacity-40 w-full h-8 self-end shrink-0' />
      <Skeleton className='opacity-40 w-full h-100 shrink-0' />
      <Skeleton className='opacity-40 w-full h-8 self-end shrink-0 mt-16' />
      <Skeleton className='opacity-40 w-full h-200 shrink-0' />
    </div>
  );
};
