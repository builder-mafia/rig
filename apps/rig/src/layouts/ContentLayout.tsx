export const ContentLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <section className='flex min-w-0 flex-1 flex-col bg-background'>
      {children}
    </section>
  );
};
