import { useAtomValue } from 'jotai';
import { contentTypeAtom } from '../contentTypeAtom';
import { useSelectionContext } from '../SelectionContext';
import { HeaderActionsView } from './HeaderActionsView';
import { HeaderTitleView } from './HeaderTitleView';

export const HeaderView = () => {
  const contentType = useAtomValue(contentTypeAtom);
  const { selectedFile } = useSelectionContext();

  return (
    <div className='h-12 border-b px-4 flex items-center justify-between gap-2'>
      <HeaderTitleView paneType={contentType} selectedFile={selectedFile} />
      <HeaderActionsView paneType={contentType} selectedFile={selectedFile} />
    </div>
  );
};
