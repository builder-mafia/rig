import { Button } from '@allin/ui';
import { useAtom, useSetAtom } from 'jotai';
import { Sparkles } from 'lucide-react';
import type { ContentType } from '../contentTypeAtom';
import { isRightDockOpenAtom, rightDockPaneAtom } from '../rightDockAtom';
import type { SelectedFile } from '../SelectionContext';

type Props = {
  paneType: ContentType;
  selectedFile: SelectedFile | null;
};

export const HeaderActionsView = ({ paneType, selectedFile }: Props) => {
  const [isRightDockOpen, setIsRightDockOpen] = useAtom(isRightDockOpenAtom);
  const [rightDockPane, setRightDockPane] = useAtom(rightDockPaneAtom);
  const canOpenAIEdit = paneType === 'content' && selectedFile;

  const onClickAIButton = () => {
    if (rightDockPane === 'chat' && isRightDockOpen) {
      setIsRightDockOpen(false);
      return;
    }

    setIsRightDockOpen(true);
    setRightDockPane('chat');
  };

  return (
    <div className='flex items-center gap-2'>
      <Button
        onClick={onClickAIButton}
        size='sm'
        variant='outline'
        disabled={!canOpenAIEdit}
      >
        <Sparkles className='size-4' />
        AI Edit
      </Button>
    </div>
  );
};
