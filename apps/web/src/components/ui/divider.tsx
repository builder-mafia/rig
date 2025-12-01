import type { ComponentProps } from 'react';
import { cn } from '@/utils/cn';

type DividerProps = {
  className?: string;
} & ComponentProps<'div'>;

export const Divider = ({ className, ...props }: DividerProps) => {
  return (
    <div
      {...props}
      className={cn('my-2 w-full h-[1px] bg-border', className)}
    />
  );
};
