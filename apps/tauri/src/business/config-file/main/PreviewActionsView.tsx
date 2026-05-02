import { Button } from '@allin/ui';
import { assert } from 'es-toolkit';
import { ExternalLink } from 'lucide-react';
import { getApplicationIconUrl } from '../AppIconPresets';
import { useSelectionContext } from '../SelectionContext';
import { useAppOpener } from './useAppOpener';

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

export const PreviewActionsView = () => {
  const { openApp } = useAppOpener();
  const { selectedFile } = useSelectionContext();
  assert(selectedFile?.path, 'Selected file path is required');

  return (
    <aside className='flex w-56 shrink-0 flex-col justify-center gap-3 border-l bg-slate-50/80 p-4'>
      <PreviewActionButton
        iconSrc={getApplicationIconUrl('chrome')!}
        label='Finder'
        onClick={() => openApp('finder', selectedFile.path)}
      />
      <PreviewActionButton
        iconSrc={getApplicationIconUrl('opencode')!}
        label='Opencode'
        onClick={() => openApp('opencode', selectedFile.path)}
      />
      <PreviewActionButton
        iconSrc={getApplicationIconUrl('cursor')!}
        label='Cursor'
        onClick={() => openApp('cursor', selectedFile.path)}
      />
      <PreviewActionButton
        iconSrc={getApplicationIconUrl('zed')!}
        label='Zed'
        onClick={() => openApp('zed', selectedFile.path)}
      />
      <div className='rounded-2xl border border-dashed border-slate-200 bg-white/70 px-4 py-3 text-xs leading-5 text-slate-500'>
        Preview only. Edit this file in your preferred external app.
      </div>
    </aside>
  );
};
