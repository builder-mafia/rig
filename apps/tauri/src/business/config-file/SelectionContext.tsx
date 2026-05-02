import { createContext, use, useMemo, useState } from 'react';

export type SelectedFile = {
  fileName: string;
  path: string;
  content: string;
  createdAt: number;
  updatedAt: number;
};

export const SelectionContext = createContext<{
  selectedFile: SelectedFile | null;
  setSelectedFile: (file: SelectedFile | null) => void;
}>({
  selectedFile: null,
  setSelectedFile: () => {},
});

export const SelectionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const value = useMemo(
    () => ({
      selectedFile,
      setSelectedFile,
    }),
    [selectedFile],
  );

  return <SelectionContext value={value}>{children}</SelectionContext>;
};

export const useSelectionContext = () => {
  return use(SelectionContext);
};
