import type { Skill } from './types';
import { getSkillIdentity } from './skillIdentity';

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
  const folderById = new Map<string, SkillFolder>();
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
      // Overlapping registered roots may show the same directory in distinct
      // branches. Keep both the lookup and flat-row identity root-specific.
      const id = JSON.stringify([scopeId, rootPath, path]);
      let child = folderById.get(id);
      if (!child) {
        child = { id, label, path, folders: [], skills: [], count: 0 };
        folder.folders.push(child);
        folderById.set(id, child);
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
): Skill[] => {
  const skills: Skill[] = [];
  const visit = (nodes: SkillFolder[]) => {
    for (const folder of nodes) {
      if (collapsedIds.has(folder.id)) continue;
      for (const skill of folder.skills) skills.push(skill);
      visit(folder.folders);
    }
  };
  visit(folders);
  return skills;
};

// Filtering preserves unaffected branches and never rebuilds/sorts the path tree.
export const filterSkillTree = (
  folders: SkillFolder[],
  matches: (skill: Skill) => boolean,
): SkillFolder[] => {
  const filtered: SkillFolder[] = [];
  for (const folder of folders) {
    const skills = folder.skills.filter(matches);
    const children = filterSkillTree(folder.folders, matches);
    const count =
      skills.length + children.reduce((sum, child) => sum + child.count, 0);
    if (!count) continue;
    filtered.push(
      count === folder.count
        ? folder
        : { ...folder, skills, folders: children, count },
    );
  }
  return filtered;
};

export type SkillTreeRow =
  | {
      kind: 'folder';
      id: string;
      depth: number;
      folder: SkillFolder;
      expanded: boolean;
    }
  | { kind: 'skill'; id: string; depth: number; skill: Skill };

export const flattenSkillTree = (
  folders: SkillFolder[],
  collapsedIds: ReadonlySet<string>,
): SkillTreeRow[] => {
  const rows: SkillTreeRow[] = [];
  const visit = (nodes: SkillFolder[], depth: number) => {
    for (const folder of nodes) {
      const expanded = !collapsedIds.has(folder.id);
      rows.push({ kind: 'folder', id: folder.id, depth, folder, expanded });
      if (!expanded) continue;
      for (const skill of folder.skills)
        rows.push({
          kind: 'skill',
          id: getSkillIdentity(skill),
          depth: depth + 1,
          skill,
        });
      visit(folder.folders, depth + 1);
    }
  };
  visit(folders, 0);
  return rows;
};
