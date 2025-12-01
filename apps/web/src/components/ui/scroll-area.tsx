'use client';

import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

const ScrollArea = forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
    /**
     * 스크롤바 강제 마운트
     */
    forceMount?: true;
    /**
     * 스크롤바 클래스 이름
     */
    scrollBarClassName?: string;
  }
>(({ className, children, forceMount, scrollBarClassName, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    className={cn('relative overflow-hidden', className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport
      ref={ref}
      className={cn(
        'h-full w-full rounded-[inherit]',
        '[--scroll-shadow-size:12px]',
        '[mask-image:linear-gradient(to_bottom,transparent_0,black_0,black_calc(100%-var(--scroll-shadow-size)),transparent_100%)]',
      )}
    >
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar forceMount={forceMount} className={scrollBarClassName} />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = 'vertical', ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      'flex touch-none select-none p-0.5 transition-colors',
      orientation === 'vertical' &&
        'h-full w-2.5 border-l border-l-transparent',
      orientation === 'horizontal' &&
        'h-2.5 flex-col border-t border-t-transparent',
      className,
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className='relative flex-1 rounded-full bg-border' />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
