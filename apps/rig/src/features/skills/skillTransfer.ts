import { z } from 'zod';
import type { Skill, SkillRoot } from './types';

export const SKILL_TRANSFER_TYPE = 'application/vnd.rig.skills+json';
const safeRelative = (path: string) =>
  !!path &&
  !/^(?:[\\/]|[A-Za-z]:)/.test(path) &&
  path.split(/[\\/]/).every(part => !!part && part !== '.' && part !== '..');
const reference = z.object({
  rootPath: z
    .string()
    .min(1)
    .max(4096)
    .refine(
      path => /^(?:\/|[A-Za-z]:[\\/])/.test(path) && !path.includes('\0'),
    ),
  relativePath: z
    .string()
    .max(4096)
    .refine(path => safeRelative(path) && !path.includes('\0')),
  name: z.string().min(1).max(1024),
});
const payloadSchema = z.object({
  type: z.literal('rig.skills'),
  version: z.literal(1),
  skills: z.array(reference).min(1).max(500),
});
export type SkillTransfer = z.infer<typeof payloadSchema>;
export interface SkillCopyTarget {
  rootPath: string;
  relativeFolder: string;
  path: string;
}
export const normalizeTransferPath = (path: string) =>
  path.replaceAll('\\', '/').replace(/\/+$/, '');

export const createSkillTransfer = (skills: Skill[]): SkillTransfer | null => {
  if (skills.some(skill => skill.isArchived)) return null;
  return parseSkillTransfer(
    JSON.stringify({
      type: 'rig.skills',
      version: 1,
      skills: skills.map(({ rootPath, relativePath, name }) => ({
        rootPath,
        relativePath,
        name,
      })),
    }),
  );
};
export const parseSkillTransfer = (raw: string): SkillTransfer | null => {
  if (raw.length > 1_000_000) return null;
  try {
    const parsed = payloadSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    const seen = new Set<string>();
    return {
      ...parsed.data,
      skills: parsed.data.skills.filter(skill => {
        const key = JSON.stringify([skill.rootPath, skill.relativePath]);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }),
    };
  } catch {
    return null;
  }
};
export const hasSkillTransfer = (data: Pick<DataTransfer, 'types'> | null) =>
  !!data && Array.from(data.types).includes(SKILL_TRANSFER_TYPE);
export const writeSkillTransfer = (
  data: DataTransfer,
  payload: SkillTransfer,
) => {
  data.setData(SKILL_TRANSFER_TYPE, JSON.stringify(payload));
  data.setData(
    'text/plain',
    payload.skills.map(skill => skill.name).join('\n'),
  );
};
export const readSkillTransfer = (data: DataTransfer | null) =>
  hasSkillTransfer(data)
    ? parseSkillTransfer(data!.getData(SKILL_TRANSFER_TYPE))
    : null;

export const getFolderCopyTarget = (
  roots: SkillRoot[],
  path: string,
): SkillCopyTarget | null => {
  const folder = normalizeTransferPath(path);
  const root = roots
    .filter(
      root =>
        folder === normalizeTransferPath(root.path) ||
        folder.startsWith(`${normalizeTransferPath(root.path)}/`),
    )
    .sort((a, b) => b.path.length - a.path.length)[0];
  if (!root) return null;
  const relativeFolder = folder
    .slice(normalizeTransferPath(root.path).length)
    .replace(/^\//, '');
  if (relativeFolder && !safeRelative(relativeFolder)) return null;
  return { rootPath: root.path, relativeFolder, path: folder };
};
export const getRepositoryCopyTarget = (
  roots: SkillRoot[],
  scopeId: string,
): SkillCopyTarget | null => {
  const root = roots.find(
    root => root.scopeKind === 'repository' && root.scopeId === scopeId,
  );
  return root
    ? {
        rootPath: root.path,
        relativeFolder: '.agents/skills',
        path: `${normalizeTransferPath(root.path)}/.agents/skills`,
      }
    : null;
};

export const isTextEditing = (target: EventTarget | null) =>
  target instanceof Element &&
  !!target.closest(
    'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="dialog"], [role="alertdialog"]',
  );
