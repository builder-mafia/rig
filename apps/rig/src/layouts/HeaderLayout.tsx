export const HeaderLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <header className='flex h-14 shrink-0 items-center border-b bg-background px-6'>
      {children}
    </header>
  );
};
