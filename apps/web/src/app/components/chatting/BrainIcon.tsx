import { Brain } from 'lucide-react';

export const BrainIcon = () => {
  return (
    <>
      <svg
        aria-hidden='true'
        className='absolute h-0 w-0'
        xmlns='http://www.w3.org/2000/svg'
      >
        <defs>
          <linearGradient
            id={'thinking-gradient'}
            x1='0%'
            y1='0%'
            x2='100%'
            y2='100%'
          >
            <stop offset='0%' stopColor='#38bdf8' />
            <stop offset='100%' stopColor='#2563eb' />
          </linearGradient>
        </defs>
      </svg>
      <Brain className='size-4 stroke-1' stroke={`url(#thinking-gradient)`} />
    </>
  );
};
