import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  createReadUsageEntries,
  createUsageEntries,
  getExplicitSkillNames,
} from './log-skill-usage.mjs';
import { getReadSkillPaths, getSkillName } from './skill-reads.mjs';

test('extracts unique explicit skill mentions', () => {
  const input = {
    hook_event_name: 'UserPromptSubmit',
    prompt: 'Use $skill-creator, then $plugin-name:review and $skill-creator.',
  };

  assert.deepEqual(getExplicitSkillNames(input), [
    'skill-creator',
    'plugin-name:review',
  ]);
});

test('ignores escaped, monetary, and non-prompt values', () => {
  assert.deepEqual(
    getExplicitSkillNames({
      hook_event_name: 'UserPromptSubmit',
      prompt: String.raw`Explain \$skill-creator and a $100 budget.`,
    }),
    [],
  );
  assert.deepEqual(
    getExplicitSkillNames({
      hook_event_name: 'PostToolUse',
      prompt: 'Use $skill-creator.',
    }),
    [],
  );
});

test('creates privacy-minimal explicit entries', () => {
  const entries = createUsageEntries(
    {
      hook_event_name: 'UserPromptSubmit',
      prompt: '$CAVEMAN-COMMIT write a message for secret details',
      session_id: 'session-1',
      turn_id: 'turn-1',
      cwd: '/workspace',
    },
    '2026-08-02T00:00:00.000Z',
  );

  assert.deepEqual(entries, [
    {
      source: 'codex',
      skillName: 'caveman-commit',
      usedAt: '2026-08-02T00:00:00.000Z',
      trackingMode: 'explicit',
      sessionId: 'session-1',
      turnId: 'turn-1',
      cwd: '/workspace',
    },
  ]);
  assert.equal(JSON.stringify(entries).includes('secret details'), false);
});

test('appends hook output in the format Rig reads', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'rig-codex-hook-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const logPath = join(directory, 'usage.jsonl');
  const scriptPath = fileURLToPath(
    new URL('./log-skill-usage.mjs', import.meta.url),
  );
  const input = JSON.stringify({
    hook_event_name: 'UserPromptSubmit',
    prompt: 'Use $skill-creator and $caveman-commit.',
    session_id: 'session-2',
    cwd: '/workspace',
  });

  await runHook(scriptPath, input, logPath);

  const records = (await readFile(logPath, 'utf8'))
    .trim()
    .split('\n')
    .map(line => JSON.parse(line));

  assert.deepEqual(
    records.map(record => [record.source, record.skillName]),
    [
      ['codex', 'skill-creator'],
      ['codex', 'caveman-commit'],
    ],
  );
});

const bashRead = (command, response = { exit_code: 0 }) => ({
  hook_event_name: 'PostToolUse',
  tool_name: 'Bash',
  tool_input: { command },
  tool_response: response,
  session_id: 'session-1',
  turn_id: 'turn-1',
  tool_use_id: 'call-1',
  cwd: '/workspace',
});

test('normalizes namespaced mentions to the names Rig discovers', () => {
  const entries = createUsageEntries({
    hook_event_name: 'UserPromptSubmit',
    prompt: '$plugin-name:review and $review',
  });
  assert.deepEqual(
    entries.map(entry => entry.skillName),
    ['review'],
  );
});

test('detects common shell reads, quoting, multiple files, and command working directories', () => {
  for (const command of [
    'cat /skills/review/SKILL.md',
    '/bin/cat -- /skills/review/SKILL.md',
    'head -n 80 /skills/review/SKILL.md',
    'tail -n +2 /skills/review/SKILL.md',
    "sed -n '1,200p' /skills/review/SKILL.md",
    "sed -n -e '1,200p' -- /skills/review/SKILL.md",
    'cat < /skills/review/SKILL.md',
    'cat /skills/review/SKILL.md | head -n 80',
    'cd /skills/review && cat SKILL.md',
  ]) {
    assert.deepEqual(
      getReadSkillPaths(bashRead(command)),
      ['/skills/review/SKILL.md'],
      command,
    );
  }
  assert.deepEqual(
    getReadSkillPaths(
      bashRead(
        'cat "/skills/with spaces/SKILL.md" /skills/other/SKILL.md\nsed -n \'1,20p\' /skills/other/SKILL.md',
      ),
    ),
    ['/skills/with spaces/SKILL.md', '/skills/other/SKILL.md'],
  );
  const relativeRead = bashRead('cat .agents/skills/review/SKILL.md');
  relativeRead.tool_input.workdir = '/another-project';
  assert.deepEqual(getReadSkillPaths(relativeRead), [
    '/another-project/.agents/skills/review/SKILL.md',
  ]);
});

test('does not count listings, writes, script text, or unrelated documents', () => {
  for (const command of [
    'rg --files /skills -g SKILL.md',
    'ls /skills/review/SKILL.md',
    'echo /skills/review/SKILL.md',
    'printf "%s" /skills/review/SKILL.md',
    'cat > /skills/review/SKILL.md',
    "sed -i 's/old/new/' /skills/review/SKILL.md",
    "sed -n 'w /skills/review/SKILL.md' /tmp/input",
    'cat /skills/review/references/guide.md',
    'cat $SKILL_PATH/SKILL.md',
    'cat $(pwd)/SKILL.md',
    'cat <<EOF\n/skills/review/SKILL.md\nEOF',
    'if false; then\ncat /skills/review/SKILL.md\nfi',
    'cat /skills/review/SKILL.md || true',
  ])
    assert.deepEqual(getReadSkillPaths(bashRead(command)), [], command);
});

test('supports Codex raw stdout and output envelopes while rejecting failure or running states', () => {
  for (const response of [
    '---\nname: review\ndescription: Review changes\n---\nSkill instructions',
    { exit_code: 0 },
    { metadata: { exit_code: 0 }, output: 'skill contents' },
    JSON.stringify({ exit_code: 0 }),
    'Process exited with code 0\nFinal output:\nskill contents',
    {
      content: [
        {
          type: 'text',
          text: 'Process exited with code 0\nFinal output:\nskill contents',
        },
      ],
    },
  ])
    assert.equal(
      getReadSkillPaths(bashRead('cat /skills/review/SKILL.md', response))
        .length,
      1,
    );

  for (const response of [
    null,
    { exit_code: 1 },
    { metadata: { exit_code: 2 } },
    { exit_code: null, session_id: 42 },
    { isError: true, exit_code: 0 },
    'Process exited with code 1\nFinal output:\nPermission denied',
    'Process running with session ID 42\nPartial output',
  ])
    assert.deepEqual(
      getReadSkillPaths(bashRead('cat /skills/review/SKILL.md', response)),
      [],
    );
});

test('detects structured file reads, including MCP, without inspecting catalog output', () => {
  const event = {
    ...bashRead(''),
    tool_name: 'mcp__filesystem__read_multiple_files',
    tool_input: {
      paths: [
        '/skills/review/SKILL.md',
        '/skills/other/SKILL.md',
        '/tmp/README.md',
      ],
    },
    tool_response: { content: [{ type: 'text', text: 'skill contents' }] },
  };
  assert.deepEqual(getReadSkillPaths(event), [
    '/skills/review/SKILL.md',
    '/skills/other/SKILL.md',
  ]);
  assert.deepEqual(
    getReadSkillPaths({ ...event, tool_response: { isError: true } }),
    [],
  );
  assert.deepEqual(
    getReadSkillPaths({ ...event, tool_name: 'apply_patch' }),
    [],
  );
  assert.deepEqual(
    getReadSkillPaths({ ...event, hook_event_name: 'PreToolUse' }),
    [],
  );
  assert.deepEqual(
    getReadSkillPaths({ ...event, tool_input: { path: '/tmp/catalog.md' } }),
    [],
  );
  assert.deepEqual(
    getReadSkillPaths({
      ...event,
      tool_name: 'Read',
      tool_input: { file_path: '/skills/review/SKILL.md' },
    }),
    ['/skills/review/SKILL.md'],
  );
});

test('uses frontmatter names with directory fallback', () => {
  for (const name of ['review', '"review"', "'review'", 'review # a comment']) {
    assert.equal(
      getSkillName(
        `---\nname: ${name}\ndescription: Private contents\n---\nBody`,
        '/skills/different-folder/SKILL.md',
      ),
      'review',
    );
  }
  assert.equal(
    getSkillName('No frontmatter', '/skills/fallback/SKILL.md'),
    'fallback',
  );
});

test('records read metadata without storing prompt text, commands, output, or skill contents', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'rig-codex-read-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const skillPath = join(directory, 'SKILL.md');
  await writeFile(
    skillPath,
    '---\nname: review\n---\nPrivate skill instructions',
  );
  const event = bashRead(`cat "${skillPath}"`, {
    exit_code: 0,
    output: 'Private tool output',
  });
  event.prompt = 'Private prompt';
  const entries = await createReadUsageEntries(
    event,
    '2026-09-11T00:00:00.000Z',
  );
  assert.deepEqual(entries, [
    {
      source: 'codex',
      skillName: 'review',
      skillPath,
      usedAt: '2026-09-11T00:00:00.000Z',
      trackingMode: 'read',
      sessionId: 'session-1',
      turnId: 'turn-1',
      toolUseId: 'call-1',
      cwd: '/workspace',
    },
  ]);
  assert.equal(JSON.stringify(entries).includes('Private'), false);
  assert.deepEqual(
    await createReadUsageEntries(
      bashRead(`cat "${directory}/missing/SKILL.md"`),
    ),
    [],
  );
});

test('hook process appends concurrent observations and honors disable/custom log settings', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'rig-codex-process-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const skillDirectory = join(directory, 'review');
  await mkdir(skillDirectory);
  const skillPath = join(skillDirectory, 'SKILL.md');
  await writeFile(
    skillPath,
    '---\nname: review\n---\nPrivate skill instructions',
  );
  const logPath = join(directory, 'custom', 'usage.jsonl');
  const scriptPath = fileURLToPath(
    new URL('./log-skill-usage.mjs', import.meta.url),
  );
  // Real Codex PostToolUse Bash payloads contain raw stdout, not exit_code.
  const event = bashRead(
    `cat "${skillPath}"`,
    await readFile(skillPath, 'utf8'),
  );
  await Promise.all(
    Array.from({ length: 6 }, (_, i) =>
      runHook(
        scriptPath,
        JSON.stringify({ ...event, tool_use_id: `call-${i}` }),
        logPath,
      ),
    ),
  );
  const lines = (await readFile(logPath, 'utf8'))
    .trim()
    .split('\n')
    .map(JSON.parse);
  assert.equal(lines.length, 6);
  assert.equal(new Set(lines.map(line => line.toolUseId)).size, 6);
  assert.ok(
    lines.every(
      line => line.turnId === 'turn-1' && line.skillName === 'review',
    ),
  );

  await runHook(scriptPath, JSON.stringify(event), logPath, {
    RIG_USAGE_DISABLED: '1',
  });
  await runHook(scriptPath, 'invalid JSON', logPath);
  assert.equal((await readFile(logPath, 'utf8')).trim().split('\n').length, 6);
});

const runHook = (scriptPath, input, logPath, extraEnv = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], {
      env: {
        ...process.env,
        RIG_USAGE_DISABLED: '',
        RIG_USAGE_SOURCE: 'codex',
        RIG_USAGE_LOG_PATH: logPath,
        ...extraEnv,
      },
      stdio: ['pipe', 'ignore', 'pipe'],
    });
    let errorOutput = '';

    child.stderr.on('data', chunk => {
      errorOutput += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(errorOutput || `Hook exited with ${code}`));
    });
    child.stdin.end(input);
  });
