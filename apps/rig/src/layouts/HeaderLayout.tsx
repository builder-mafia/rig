export const HeaderLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <header className='flex h-18 shrink-0 items-center border-b bg-background'>
      {children}
    </header>
  );
};
