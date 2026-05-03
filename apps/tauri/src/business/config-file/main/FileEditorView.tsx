'use client';

import { getFileTypeFromPath } from '../getFileTypeFromPath';
import type { SelectedFile } from '../SelectionContext';
import { useAIEditContext } from './ai-edit/AIEditContext';
import { DiffEditorView } from './ai-edit/diff/DiffEditorView';
import { HunkListView } from './ai-edit/diff/HunkListView';
import { LockBannerView } from './ai-edit/diff/LockBannerView';
import type { useAIEdit } from './ai-edit/useAIEdit';
import { EditorView } from './EditorView';

type FileEditorViewProps = {
  selectedFile: SelectedFile;
};

type AIEditController = ReturnType<typeof useAIEdit>;

export const FileEditorView = ({ selectedFile }: FileEditorViewProps) => {
  const language = getFileTypeFromPath(selectedFile.path);
  const { ai, draftContent, setDraftContent } = useAIEditContext();

  return (
    <div className='flex h-full w-full'>
      <div className='flex min-w-0 flex-1 flex-col'>
        <FileEditorHeaderView
          selectedFile={selectedFile}
        />
        <FileEditorContentView
          ai={ai}
          draftContent={draftContent}
          language={language}
          onDraftContentChange={setDraftContent}
        />
      </div>
    </div>
  );
};

const FileEditorHeaderView = ({
  selectedFile,
}: {
  selectedFile: SelectedFile;
}) => {
  const hasChanges = selectedFile.updatedAt > selectedFile.createdAt;

  return (
    <div className='flex h-11 shrink-0 items-center gap-2 border-b px-4'>
      <span className='truncate text-sm font-medium'>
        {selectedFile.fileName}
      </span>
      <span className='min-w-0 truncate font-mono text-xs text-muted-foreground'>
        {selectedFile.path}
      </span>
      <div className='flex-1' />
      {hasChanges ? (
        <span className='text-xs font-medium text-amber-600'>
          Changes occurred
        </span>
      ) : null}
    </div>
  );
};

const FileEditorContentView = ({
  ai,
  draftContent,
  language,
  onDraftContentChange,
}: {
  ai: AIEditController;
  draftContent: string;
  language: string;
  onDraftContentChange: (nextContent: string) => void;
}) => {
  const isLocked = ai.phase !== 'idle';
  const showDiff = ai.phase === 'proposal-pending' && ai.proposal !== null;

  if (showDiff && ai.proposal) {
    return (
      <>
        <LockBannerView
          stats={ai.stats}
          onAcceptAll={() => void ai.applyAll()}
          onRejectAll={ai.dismiss}
        />
        <div className='grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_320px]'>
          <DiffEditorView
            language={language}
            original={draftContent}
            modified={ai.proposal.after}
          />
          <HunkListView
            hunks={ai.proposal.hunks}
            decisions={ai.decisions}
            onDecide={ai.decide}
          />
        </div>
      </>
    );
  }

  return (
    <EditorView
      language={language}
      value={draftContent}
      isReadOnly={isLocked}
      onChange={next => {
        if (isLocked) {
          ai.pendingUserEdits.current = next;
          return;
        }

        onDraftContentChange(next);
      }}
    />
  );
};
