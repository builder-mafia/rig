import type { ComponentProps } from 'react';
import { cn } from '@/utils/cn';

type MenuProps = {
  className?: string;
  children: React.ReactNode;
} & ComponentProps<'li'> &
  ComponentProps<'div'>;

const Menu = ({
  className,
  children,
  clickable = true,
  ...props
}: MenuProps & { clickable?: boolean }) => {
  return (
    <li
      {...props}
      className={cn(
        'flex flex-row gap-2 py-2 px-2 rounded-sm',
        clickable && 'cursor-pointer hover:bg-accent ',
        className,
      )}
    >
      {children}
    </li>
  );
};

const MenuHead = ({ className, children, ...props }: MenuProps) => {
  return (
    <div
      {...props}
      className={cn('flex flex-row items-center gap-2', className)}
    >
      {children}
    </div>
  );
};

const MenuContent = ({ className, children, ...props }: MenuProps) => {
  return (
    <div
      {...props}
      className={cn(
        'flex flex-col gap-2 text-sm text-foreground justify-center',
        className,
      )}
    >
      {children}
    </div>
  );
};

const MenuTail = ({ className, children, ...props }: MenuProps) => {
  return (
    <div
      {...props}
      className={cn('flex flex-row items-center ml-auto text-sm', className)}
    >
      {children}
    </div>
  );
};

Menu.Root = Menu;
Menu.Head = MenuHead;
Menu.Content = MenuContent;
Menu.Tail = MenuTail;

export { Menu };
