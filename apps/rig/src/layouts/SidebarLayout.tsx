export const SidebarLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <aside className='flex min-h-0 w-80 shrink-0 flex-col border-r bg-sidebar'>
      {children}
    </aside>
  );
};
