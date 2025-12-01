import React from 'react';
import { Badge } from '@/components/ui/badge';

export const MemoizedUserMessage = React.memo(
  ({
    content,
    ref,
  }: {
    content: string;
    ref?: React.RefObject<HTMLDivElement>;
  }) => {
    return (
      <div
        ref={ref}
        className='not-prose flex flex-col my-4 ml-auto max-w-[80%]'
      >
        <Badge className='text-sm p-1.5 px-2 rounded-xl text-wrap whitespace-pre-wrap break-keep'>
          {content}
        </Badge>
      </div>
    );
  },
);

MemoizedUserMessage.displayName = 'MemoizedUserMessage';
