import { toast } from '@allin/ui';
import { useMemo, useRef, useState } from 'react';
import { getSkillFilePath } from './insights';
import type { Skill } from './types';

export const HIDDEN_SKILLS_KEY = 'rig:hidden-skills:v1';
export const getHiddenSkillKey = (skill: Skill) =>
  getSkillFilePath(skill).replaceAll('\\', '/');

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

// Visibility is a Rig preference. Never rename or move the underlying skill.
export const useHiddenSkills = () => {
  const [paths, setPaths] = useState<string[]>(() => {
    try {
      return parseHiddenSkills(window.localStorage.getItem(HIDDEN_SKILLS_KEY));
    } catch {
      return [];
    }
  });
  const currentPaths = useRef(paths);
  const hiddenPaths = useMemo(() => new Set(paths), [paths]);

  const setSkillsHidden = (skills: Skill[], hidden: boolean) => {
    const next = new Set(currentPaths.current);
    for (const skill of skills) {
      if (hidden) next.add(getHiddenSkillKey(skill));
      else next.delete(getHiddenSkillKey(skill));
    }
    try {
      const nextPaths = [...next];
      window.localStorage.setItem(HIDDEN_SKILLS_KEY, JSON.stringify(nextPaths));
      currentPaths.current = nextPaths;
      setPaths(nextPaths);
      return true;
    } catch {
      toast.error('Couldn’t save skill visibility. Try again.');
      return false;
    }
  };
  return { hiddenPaths, setSkillsHidden };
};
