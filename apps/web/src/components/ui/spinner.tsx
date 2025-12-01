'use client';

import { Loader2 } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/utils/cn';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'secondary';
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-center', className)}
        {...props}
      >
        <Loader2
          className={cn(
            'animate-spin',
            {
              'h-3 w-3': size === 'xs',
              'h-4 w-4': size === 'sm',
              'h-6 w-6': size === 'md',
              'h-8 w-8': size === 'lg',
            },
            {
              'text-muted-foreground': variant === 'default',
              'text-primary': variant === 'primary',
              'text-secondary': variant === 'secondary',
            },
          )}
        />
      </div>
    );
  },
);
Spinner.displayName = 'Spinner';

export { Spinner };
