import type { Ref } from 'react';
import { cn } from '@/utils/cn';

type ToolToggleButtonProps = {
  value: boolean;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
  ref?: Ref<HTMLButtonElement>;
};

export const ToolToggleButton = ({
  className,
  value,
  ref,
  ...props
}: ToolToggleButtonProps) => {
  return (
    <button
      ref={ref}
      type='button'
      className={cn(
        'w-6 h-6 flex items-center justify-center rounded-full p-1.5 transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        value
          ? 'bg-green-100 ring-2 ring-green-500 hover:bg-green-200 focus-visible:ring-green-500'
          : 'bg-gray-100 hover:bg-gray-200 focus-visible:ring-gray-400 [&>svg]:opacity-50 [&>svg]:transition-opacity',
        className,
      )}
      aria-pressed={value}
      {...props}
    ></button>
  );
};
