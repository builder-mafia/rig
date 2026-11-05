import type { Skill } from './types';

export const getSkillIdentity = (
  skill: Pick<Skill, 'rootPath' | 'relativePath'> &
    Partial<Pick<Skill, 'isArchived'>>,
) =>
  `${skill.rootPath}:${skill.relativePath}:${skill.isArchived ? 'archived' : 'active'}`;
