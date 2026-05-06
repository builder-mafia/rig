'use client';

import {
  createContext,
  type ReactNode,
  use,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useSelectionContext } from '../../SelectionContext';
import { useFileSystem } from '../../useFlieSystem';
import { useAIEdit } from './useAIEdit';
import { useFileVersions } from './useFileVersions';

type AIEditContextValue = {
  ai: ReturnType<typeof useAIEdit>;
  draftContent: string;
  setDraftContent: (nextContent: string) => void;
  versions: ReturnType<typeof useFileVersions>['data'];
};

const AIEditContext = createContext<AIEditContextValue | null>(null);

export const AIEditProvider = ({ children }: { children: ReactNode }) => {
  const { selectedFile } = useSelectionContext();

  return (
    <AIEditSessionProvider key={selectedFile?.path ?? 'empty'}>
      {children}
    </AIEditSessionProvider>
  );
};

const AIEditSessionProvider = ({ children }: { children: ReactNode }) => {
  const { selectedFile, setSelectedFile } = useSelectionContext();
  const { writeFile } = useFileSystem();
  const [draftContent, setDraftContent] = useState(selectedFile?.content ?? '');

  useEffect(() => {
    setDraftContent(selectedFile?.content ?? '');
  }, [selectedFile?.content]);

  const ai = useAIEdit({
    fileId: selectedFile?.path ?? '',
    baseContent: draftContent,
    onApply: async nextContent => {
      if (!selectedFile) {
        return;
      }

      await writeFile(selectedFile.path, nextContent);
      setDraftContent(nextContent);
      setSelectedFile({
        ...selectedFile,
        content: nextContent,
        updatedAt: Date.now(),
      });
    },
  });
  const { data: versions } = useFileVersions(selectedFile?.path ?? '');

  const value = useMemo(
    () => ({
      ai,
      draftContent,
      setDraftContent,
      versions,
    }),
    [ai, draftContent, versions],
  );

  return <AIEditContext value={value}>{children}</AIEditContext>;
};

export const useAIEditContext = () => {
  const context = use(AIEditContext);

  if (!context) {
    throw new Error('useAIEditContext must be used within AIEditProvider');
  }

  return context;
};
