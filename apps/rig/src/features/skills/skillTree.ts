import type { Skill } from './types';

export interface SkillFolder {
  id: string;
  label: string;
  path: string;
  folders: SkillFolder[];
  skills: Skill[];
  count: number;
}

const normalizePath = (path: string) =>
  path.replaceAll('\\', '/').replace(/\/+$/, '');

export const abbreviateHomePath = (path: string) =>
  normalizePath(path).replace(
    /^(\/Users\/[^/]+|\/home\/[^/]+|[A-Za-z]:\/Users\/[^/]+)(?=\/)/,
    '~',
  );

export const buildSkillTree = (skills: Skill[]): SkillFolder[] => {
  const scopes = new Map<string, SkillFolder>();
  for (const skill of skills) {
    const scopeId = skill.scopeKind === 'global' ? 'global' : skill.scopeId;
    let scope = scopes.get(scopeId);
    if (!scope) {
      scope = {
        id: scopeId,
        label: scopeId === 'global' ? 'Global' : skill.scopeLabel,
        path: scopeId === 'global' ? '' : skill.scopeId,
        folders: [],
        skills: [],
        count: 0,
      };
      scopes.set(scopeId, scope);
    }
    scope.count++;
    const rootPath = normalizePath(skill.rootPath);
    const scopePath = normalizePath(skill.scopeId);
    const rootLabel =
      skill.scopeKind === 'global'
        ? abbreviateHomePath(rootPath)
        : rootPath.startsWith(`${scopePath}/`)
          ? rootPath.slice(scopePath.length + 1)
          : '.';
    // The last directory is the skill itself; only its parent folders need disclosures.
    const parents = normalizePath(skill.relativePath)
      .split('/')
      .filter(Boolean)
      .slice(0, -1);
    const segments = rootLabel === '.' ? parents : [rootLabel, ...parents];
    let folder = scope;
    let path = rootPath;
    for (const [index, label] of segments.entries()) {
      if (rootLabel === '.' || index > 0) path = `${path}/${label}`;
      const id = `${scopeId}:${path}`;
      let child = folder.folders.find(candidate => candidate.id === id);
      if (!child) {
        child = { id, label, path, folders: [], skills: [], count: 0 };
        folder.folders.push(child);
      }
      child.count++;
      folder = child;
    }
    folder.skills.push(skill);
  }
  const sortFolder = (folder: SkillFolder) => {
    folder.skills.sort(
      (a, b) =>
        a.name.localeCompare(b.name) ||
        a.relativePath.localeCompare(b.relativePath),
    );
    folder.folders.sort((a, b) => a.label.localeCompare(b.label));
    folder.folders.forEach(sortFolder);
  };
  const folders = [...scopes.values()].sort((a, b) =>
    a.id === 'global'
      ? -1
      : b.id === 'global'
        ? 1
        : a.label.localeCompare(b.label) || a.id.localeCompare(b.id),
  );
  folders.forEach(sortFolder);
  return folders;
};

export const getExpandedSkills = (
  folders: SkillFolder[],
  collapsedIds: ReadonlySet<string>,
): Skill[] =>
  folders.flatMap(folder =>
    collapsedIds.has(folder.id)
      ? []
      : [...folder.skills, ...getExpandedSkills(folder.folders, collapsedIds)],
  );
