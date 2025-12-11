'use client';

import * as SliderPrimitive from '@radix-ui/react-slider';
import type * as React from 'react';
import { useState } from 'react';
import { cn } from '@/utils/cn';

function RadioGroup({
  className,
  targets,
  defaultValue,
  value,
  onChange,
  ...props
}: Omit<
  React.ComponentProps<typeof SliderPrimitive.Root>,
  'value' | 'defaultValue' | 'onChange' | 'step' | 'min' | 'max'
> & {
  targets: string[];
  value?: string;
  defaultValue?: string;
  onChange: (value: string) => void;
}) {
  const min = 0;
  const max = targets.length - 1;

  const [innerValue, setInnerValue] = useState<number>(
    defaultValue
      ? targets.indexOf(defaultValue)
      : value
        ? targets.indexOf(value)
        : 0,
  );

  const onValueChange = (value: number[]) => {
    const target = targets[value[0]];
    setInnerValue(value[0]);
    onChange(target);
  };

  return (
    <SliderPrimitive.Root
      data-slot='slider'
      defaultValue={defaultValue ? [targets.indexOf(defaultValue)] : undefined}
      value={value ? [targets.indexOf(value)] : undefined}
      onValueChange={onValueChange}
      min={min}
      max={max}
      step={1}
      className={cn(
        'mb-8 mt-4',
        'group relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot='slider-track'
        className={cn(
          'bg-muted relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5',
        )}
      ></SliderPrimitive.Track>
      {!Array.isArray(value) &&
        Array.from({ length: Math.floor((max - min) / 1) + 1 }).map(
          (_, index) => {
            const value = min + index * 1;
            const ratio = value / max;

            const left = `calc(0% + 8px + ${100 * ratio}% + ${-16 * ratio}px)`;

            return (
              <div
                data-selected={index === innerValue}
                key={value}
                className={cn(
                  'group absolute flex -translate-x-1/2 flex-col items-center gap-1',
                  'group-aria-[disabled=true]:pointer-events-none',
                )}
                style={{ left: left }}
              >
                <div className='cursor-pointer h-6 w-6 rounded-full border bg-muted' />
                <span className='text-xs leading-none text-muted-foreground absolute top-full mt-2 group-data-[selected=true]:text-blue-400'>
                  {targets[index]}
                </span>
              </div>
            );
          },
        )}
      <SliderPrimitive.Thumb
        aria-disabled={props.disabled}
        data-slot='slider-thumb'
        className='border-primary ring-ring/50 block size-4 shrink-0 rounded-full border bg-white shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden aria-disabled:pointer-events-none'
      />
    </SliderPrimitive.Root>
  );
}

export { RadioGroup };
