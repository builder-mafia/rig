import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { getReadSkillPaths, getSkillName } from './skill-reads.mjs';

const DEFAULT_LOG_PATH = '~/.rig/usage.jsonl';
const DEFAULT_SOURCE = 'codex';
const EXPLICIT_SKILL_PATTERN =
  /(^|[^\\$A-Za-z0-9_-])\$([A-Za-z][A-Za-z0-9-]{0,63}(?::[A-Za-z][A-Za-z0-9-]{0,63})?)(?![A-Za-z0-9_-])/g;

export const getExplicitSkillNames = input => {
  if (!isRecord(input) || input.hook_event_name !== 'UserPromptSubmit') {
    return [];
  }

  if (typeof input.prompt !== 'string' || input.prompt.length === 0) {
    return [];
  }

  const names = new Set();

  for (const match of input.prompt.matchAll(EXPLICIT_SKILL_PATTERN)) {
    names.add(match[2].toLowerCase());
  }

  return [...names];
};

export const createUsageEntries = (input, usedAt = new Date().toISOString()) =>
  [
    ...new Set(
      getExplicitSkillNames(input).map(name => name.split(':').at(-1)),
    ),
  ].map(skillName => ({
    source: process.env.RIG_USAGE_SOURCE || DEFAULT_SOURCE,
    skillName,
    usedAt,
    trackingMode: 'explicit',
    sessionId: getStringProperty(input, 'session_id'),
    turnId: getStringProperty(input, 'turn_id'),
    cwd: getStringProperty(input, 'cwd'),
  }));

export const createReadUsageEntries = async (
  input,
  usedAt = new Date().toISOString(),
) => {
  const entries = [];

  for (const skillPath of getReadSkillPaths(input)) {
    try {
      const skillName = getSkillName(
        await readFile(skillPath, 'utf8'),
        skillPath,
      );
      entries.push({
        source: process.env.RIG_USAGE_SOURCE || DEFAULT_SOURCE,
        skillName,
        skillPath,
        usedAt,
        trackingMode: 'read',
        sessionId: getStringProperty(input, 'session_id'),
        turnId: getStringProperty(input, 'turn_id'),
        toolUseId: getStringProperty(input, 'tool_use_id'),
        cwd: getStringProperty(input, 'cwd'),
      });
    } catch {
      // A missing or unreadable file must not interfere with the agent's turn.
    }
  }

  return entries;
};

const main = async () => {
  if (isDisabled()) return;

  const input = await readJsonFromStdin();
  const usedAt = new Date().toISOString();
  const entries = [
    ...createUsageEntries(input, usedAt),
    ...(await createReadUsageEntries(input, usedAt)),
  ];

  if (entries.length === 0) return;

  const logPath = expandPath(
    process.env.RIG_USAGE_LOG_PATH || DEFAULT_LOG_PATH,
  );
  const lines = entries.map(entry => JSON.stringify(entry)).join('\n');

  await mkdir(dirname(logPath), { recursive: true });
  await appendFile(logPath, `${lines}\n`, 'utf8');
};

const readJsonFromStdin = async () => {
  const chunks = [];

  for await (const chunk of process.stdin) chunks.push(chunk);

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const isDisabled = () => {
  const value = process.env.RIG_USAGE_DISABLED?.toLowerCase();
  return value === '1' || value === 'true';
};

const isRecord = value => typeof value === 'object' && value !== null;

const getStringProperty = (value, key) => {
  if (!isRecord(value)) return null;
  return typeof value[key] === 'string' ? value[key] : null;
};

const expandPath = path => {
  if (path === '~') return homedir();
  if (path.startsWith('~/')) return resolve(homedir(), path.slice(2));
  return resolve(path);
};

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
