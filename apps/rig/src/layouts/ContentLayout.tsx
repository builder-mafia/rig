export const ContentLayout = () => {
  return (
    <section className='flex min-w-0 flex-1 flex-col bg-background'>
      <div className='h-14 shrink-0 border-b px-6 py-4'>
        <p className='text-sm font-semibold'>Content Area</p>
      </div>
      <div className='min-h-0 flex-1 p-6'>
        <div className='h-full rounded-2xl border border-dashed bg-muted/30' />
      </div>
    </section>
  );
};
