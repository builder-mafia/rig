import { getFileTypeFromPath } from '../getFileTypeFromPath';
import type { SelectedFile } from '../SelectionContext';
import { EditorView } from './EditorView';
import { PreviewActionsView } from './PreviewActionsView';

export const FileEditorView = ({
  selectedFile,
}: {
  selectedFile: SelectedFile;
}) => {
  const fileType = getFileTypeFromPath(selectedFile.path);

  return (
    <div className='flex h-full min-h-0'>
      <div className='min-w-0 flex-1'>
        <EditorView
          language={fileType}
          value={selectedFile.content}
          onChange={() => {}}
        />
      </div>
      <PreviewActionsView />
    </div>
  );
};
