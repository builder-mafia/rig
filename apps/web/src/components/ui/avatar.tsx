'use client';

import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva } from 'class-variance-authority';
import type * as React from 'react';
import { cn } from '@/utils/cn';

const AvatarSizeVariants = cva(
  'relative flex size-8 shrink-0 overflow-hidden rounded-full',
  {
    variants: {
      size: {
        xs: 'size-4',
        sm: 'size-6',
        md: 'size-8',
        lg: 'size-10',
        xl: 'size-12',
      },
    },
  },
);

function Avatar({
  className,
  size = 'md',
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}) {
  return (
    <AvatarPrimitive.Root
      data-slot='avatar'
      className={cn(AvatarSizeVariants({ size }), className)}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot='avatar-image'
      className={cn('aspect-square size-full', className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot='avatar-fallback'
      className={cn(
        'bg-muted flex size-full items-center justify-center rounded-full',
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
