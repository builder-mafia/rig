import { Button } from '@allin/ui';
import { ExternalLink } from 'lucide-react';
import { FINDER_ICON_PATH, ZED_ICON_PATH } from '../configFileWorkbenchUtils';

type PreviewActionButtonProps = {
  iconSrc: string;
  label: string;
  onClick: () => void;
};

const PreviewActionButton = ({
  iconSrc,
  label,
  onClick,
}: PreviewActionButtonProps) => {
  return (
    <Button
      type='button'
      variant='outline'
      className='h-14 w-full justify-between rounded-2xl border-slate-200 bg-white/90 px-4 text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900'
      onClick={onClick}
    >
      <span className='flex items-center gap-3'>
        <span className='inline-flex size-8 items-center justify-center overflow-hidden rounded-xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.1)]'>
          <img src={iconSrc} alt={label} className='size-5 object-contain' />
        </span>
        <span className='text-sm font-medium'>{label}</span>
      </span>
      <ExternalLink className='size-4 shrink-0' />
    </Button>
  );
};

type Props = {
  isDarkMode: boolean;
  onOpenInFinder: () => void;
  onOpenInOpencode: () => void;
  onOpenInZed: () => void;
};

export const PreviewActionsView = ({
  isDarkMode,
  onOpenInFinder,
  onOpenInOpencode,
  onOpenInZed,
}: Props) => {
  const opencodeIconSrc = isDarkMode
    ? '/application_icon/opencode-dark.webp'
    : '/application_icon/opencode-light.webp';

  return (
    <aside className='flex w-56 shrink-0 flex-col justify-center gap-3 border-l bg-slate-50/80 p-4'>
      <PreviewActionButton
        iconSrc={FINDER_ICON_PATH}
        label='Finder'
        onClick={onOpenInFinder}
      />
      <PreviewActionButton
        iconSrc={opencodeIconSrc}
        label='Opencode'
        onClick={onOpenInOpencode}
      />
      <PreviewActionButton
        iconSrc={ZED_ICON_PATH}
        label='Zed'
        onClick={onOpenInZed}
      />
      <div className='rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-3 text-xs leading-5 text-slate-500'>
        Preview only. Edit this file in your preferred external app.
      </div>
    </aside>
  );
};
