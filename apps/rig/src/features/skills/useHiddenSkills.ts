import { useI18n } from '@/lib/preferences';
import { toast } from '@allin/ui';
import { useMemo, useRef, useState } from 'react';
import { getSkillFilePath } from './insights';
import type { Skill } from './types';

export const HIDDEN_SKILLS_KEY = 'rig:hidden-skills:v1';
export const HIDDEN_FOLDERS_KEY = 'rig:hidden-folders:v1';
const normalizePath = (path: string) =>
  path.replaceAll('\\', '/').replace(/\/+$/, '');
export const getHiddenSkillKey = (skill: Skill) =>
  normalizePath(getSkillFilePath(skill));

// Match directory boundaries, so hiding /tools never hides /tools-extra.
export const getHidingFolder = (
  path: string,
  folders: ReadonlySet<string>,
): string | undefined => {
  const normalizedPath = normalizePath(path);
  let parent: string | undefined;
  for (const folder of folders) {
    if (
      (normalizedPath === folder || normalizedPath.startsWith(`${folder}/`)) &&
      (parent === undefined || folder.length < parent.length)
    )
      parent = folder;
  }
  return parent;
};

export const parseHiddenSkills = (value: string | null): string[] => {
  try {
    const parsed: unknown = JSON.parse(value ?? '[]');
    return Array.isArray(parsed)
      ? [
          ...new Set(
            parsed.filter(
              (path): path is string =>
                typeof path === 'string' && path.length > 0,
            ),
          ),
        ]
      : [];
  } catch {
    return [];
  }
};

const useHiddenPaths = (storageKey: string) => {
  const { t } = useI18n();

  const [paths, setPaths] = useState<string[]>(() => {
    try {
      return parseHiddenSkills(window.localStorage.getItem(storageKey)).map(
        normalizePath,
      );
    } catch {
      return [];
    }
  });
  const currentPaths = useRef(paths);
  const hiddenPaths = useMemo(() => new Set(paths), [paths]);

  const setHidden = (changedPaths: string[], hidden: boolean) => {
    const next = new Set(currentPaths.current);
    for (const path of changedPaths) {
      if (hidden) next.add(normalizePath(path));
      else next.delete(normalizePath(path));
    }
    try {
      const nextPaths = [...next];
      window.localStorage.setItem(storageKey, JSON.stringify(nextPaths));
      currentPaths.current = nextPaths;
      setPaths(nextPaths);
      return true;
    } catch {
      toast.error(t('Couldn’t save skill visibility. Try again.'));
      return false;
    }
  };
  return { hiddenPaths, setHidden };
};

// Visibility is a Rig preference. Never rename or move the underlying files.
export const useHiddenSkills = () => {
  const skills = useHiddenPaths(HIDDEN_SKILLS_KEY);
  const folders = useHiddenPaths(HIDDEN_FOLDERS_KEY);
  return {
    hiddenPaths: skills.hiddenPaths,
    hiddenFolderPaths: folders.hiddenPaths,
    setSkillsHidden: (changedSkills: Skill[], hidden: boolean) =>
      skills.setHidden(changedSkills.map(getHiddenSkillKey), hidden),
    setFolderHidden: (path: string, hidden: boolean) =>
      folders.setHidden([path], hidden),
  };
};
