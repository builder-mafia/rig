import { getSkillFilePath } from './insights';
import type { Skill } from './types';

export const normalizeSkillPath = (path: string) =>
  path.replaceAll('\\', '/').replace(/\/+$/, '');

export const getSkillDirectory = (skill: Skill) =>
  normalizeSkillPath(getSkillFilePath(skill)).replace(/\/SKILL\.md$/, '');

export const getUniqueActiveSkills = (skills: Skill[]) => [
  ...new Map(
    skills
      .filter(skill => !skill.isArchived)
      .map(skill => [getSkillDirectory(skill), skill]),
  ).values(),
];

export const getSkillsInFolder = (skills: Skill[], folderPath: string) => {
  const path = normalizeSkillPath(folderPath);
  if (!path) return [];
  return getUniqueActiveSkills(skills).filter(skill => {
    const directory = getSkillDirectory(skill);
    return directory === path || directory.startsWith(`${path}/`);
  });
};
