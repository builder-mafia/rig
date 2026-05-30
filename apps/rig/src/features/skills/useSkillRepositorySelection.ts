import { useState } from 'react';
import { GLOBAL_REPOSITORY_ID } from './components/RepositorySelector';
import type { SkillRoot } from './types';

export const useSkillRepositorySelection = ({
  roots,
  onRepositoryChange,
}: {
  roots: SkillRoot[];
  onRepositoryChange: () => void;
}) => {
  const [selectedRepositoryId, setSelectedRepositoryId] =
    useState(GLOBAL_REPOSITORY_ID);
  const [isOpen, setIsOpen] = useState(false);

  const selectRepository = (repositoryId: string) => {
    setSelectedRepositoryId(repositoryId);
    setIsOpen(false);
    onRepositoryChange();
  };

  return {
    selectedRepositoryId,
    visibleRoots: getVisibleRoots(roots, selectedRepositoryId),
    isOpen,
    setIsOpen,
    selectRepository,
  };
};

const getVisibleRoots = (
  roots: SkillRoot[],
  selectedRepositoryId: string,
) => {
  if (selectedRepositoryId === GLOBAL_REPOSITORY_ID) {
    return roots.filter(root => root.kind === 'default');
  }

  return roots.filter(root => root.id === selectedRepositoryId);
};
