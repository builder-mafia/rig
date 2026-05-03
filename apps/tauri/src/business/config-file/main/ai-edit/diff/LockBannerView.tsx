import { Button } from '@allin/ui';
import { Lock, Sparkles } from 'lucide-react';

type LockBannerViewProps = {
  stats: { add: number; del: number; hunks: number };
  onAcceptAll: () => void;
  onRejectAll: () => void;
};

export const LockBannerView = ({
  stats,
  onAcceptAll,
  onRejectAll,
}: LockBannerViewProps) => {
  return (
    <div className='flex h-10 shrink-0 items-center gap-2 border-b bg-blue-50/60 px-3 text-xs'>
      <span className='inline-flex items-center gap-1.5 font-semibold text-blue-700'>
        <Sparkles className='size-3.5' /> AI proposal
      </span>
      <span className='inline-flex items-center gap-1 text-muted-foreground'>
        <Lock className='size-3' /> read-only while reviewing
      </span>
      <span className='ml-2 inline-flex items-center gap-2 font-mono'>
        <span className='text-emerald-600'>+{stats.add}</span>
        <span className='text-rose-600'>-{stats.del}</span>
        <span className='text-muted-foreground'>· {stats.hunks} hunks</span>
      </span>
      <span className='flex-1' />
      <Button size='sm' variant='outline' className='h-7' onClick={onRejectAll}>
        Reject all
      </Button>
      <Button size='sm' className='h-7' onClick={onAcceptAll}>
        Accept all
      </Button>
    </div>
  );
};
