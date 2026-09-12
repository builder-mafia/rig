import { homedir } from 'node:os';
import { basename, dirname, isAbsolute, resolve } from 'node:path';

// Observe ordinary reads without evaluating shell code or scanning tool output
// for paths (which would mistake a skill catalog for skill use).
export const getReadSkillPaths = input => {
  if (input?.hook_event_name !== 'PostToolUse') return [];
  const tool = input.tool_name;
  const args = input.tool_input;
  if (typeof tool !== 'string' || !args || typeof args !== 'object') return [];
  if (!hasUsableResponse(input.tool_response, tool === 'Bash')) return [];

  const cwd = args.workdir || args.cwd || input.cwd;
  if (tool === 'Bash') return shellSkillPaths(args.command, cwd);
  if (!/read/i.test(tool)) return [];

  const paths = [
    args.file_path,
    args.filePath,
    args.path,
    ...(Array.isArray(args.paths) ? args.paths : []),
  ];
  return [
    ...new Set(paths.map(path => resolveSkillPath(path, cwd)).filter(Boolean)),
  ];
};

const hasUsableResponse = (response, shell) => {
  if (response == null) return false;
  if (typeof response === 'string') {
    try {
      return hasUsableResponse(JSON.parse(response), shell);
    } catch {
      if (/^Process running with session ID\b/m.test(response)) return false;
      const exit = response.match(
        /(?:Process exited with code|exit_code["']?\s*:)\s*(-?\d+)/,
      );
      // Codex can send raw output without an exit-code envelope. Keep these
      // observations; PostToolUse alone does not guarantee a successful read.
      return exit ? Number(exit[1]) === 0 : true;
    }
  }
  if (response.isError === true || response.error || response.success === false)
    return false;
  const code =
    response.exit_code ?? response.exitCode ?? response.metadata?.exit_code;
  if (code != null) return code === 0;
  if (response.result != null) return hasUsableResponse(response.result, shell);
  if (!shell) return true;
  if (typeof response.output === 'string')
    return hasUsableResponse(response.output, true);
  if (Array.isArray(response.content)) {
    return hasUsableResponse(
      response.content
        .filter(item => item.type === 'text')
        .map(item => item.text)
        .join('\n'),
      true,
    );
  }
  return false;
};

const resolveSkillPath = (path, cwd) => {
  if (typeof path !== 'string' || basename(path) !== 'SKILL.md') return null;
  path = path.replace(/^(?:~|\$HOME|\$\{HOME\})(?=\/)/, homedir());
  // Unresolved variables, globs and substitutions cannot identify a file.
  if (/[\0\r\n$`*?{}]/.test(path)) return null;
  if (!isAbsolute(path) && (typeof cwd !== 'string' || !isAbsolute(cwd)))
    return null;
  return isAbsolute(path) ? resolve(path) : resolve(cwd, path);
};

const shellSkillPaths = (command, initialCwd) => {
  if (typeof command !== 'string' || !command.includes('SKILL.md')) return [];
  // Deliberately leave control flow, substitutions and heredocs to future
  // adapters instead of treating unexecuted script text as an observed read.
  if (
    /`|\$\(|<<|\|\||(?:^|[;&|\n])\s*(?:if|then|else|elif|for|while|until|case|function|false)\b/.test(
      command,
    )
  )
    return [];
  const tokens = tokenize(command);
  if (
    !tokens ||
    tokens.some(
      token => token.operator && ['(', ')', '&'].includes(token.value),
    )
  )
    return [];

  let cwd = initialCwd;
  let words = [];
  const paths = [];
  const consume = () => {
    if (words.length === 0) return;
    const executable = basename(words[0]);
    const args = words.slice(1);
    if (executable === 'cd') {
      const directory = args.find(arg => arg !== '--');
      if (directory && !/[$`*?]/.test(directory)) {
        const expanded = directory.replace(/^~(?=\/)/, homedir());
        cwd = isAbsolute(expanded)
          ? resolve(expanded)
          : typeof cwd === 'string'
            ? resolve(cwd, expanded)
            : null;
      } else {
        cwd = null;
      }
    } else {
      for (const path of readOperands(executable, args)) {
        const resolved = resolveSkillPath(path, cwd);
        if (resolved) paths.push(resolved);
      }
    }
    words = [];
  };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.operator) {
      if (['>', '>>', '<'].includes(token.value)) {
        // Input redirection reads a file; output redirection does not.
        if (token.value === '<' && tokens[i + 1] && !tokens[i + 1].operator)
          words.push(tokens[i + 1].value);
        i++;
      } else {
        consume();
      }
    } else {
      words.push(token.value);
    }
  }
  consume();
  return [...new Set(paths)];
};

const readOperands = (command, args) => {
  if (!['cat', 'head', 'tail', 'sed'].includes(command)) return [];
  if (
    command === 'sed' &&
    args.some(arg => /^--in-place(?:=|$)|^-[^-]*i/.test(arg))
  )
    return [];
  let scriptSeen = command !== 'sed';
  let options = true;
  const paths = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (options && arg === '--') {
      options = false;
      continue;
    }
    if (options && arg.startsWith('-')) {
      if (command === 'sed' && /^-(?:e|f)$|^--(?:expression|file)$/.test(arg)) {
        scriptSeen = true;
        i++;
      } else if (
        command === 'sed' &&
        /^-[ef].+|^--(?:expression|file)=/.test(arg)
      )
        scriptSeen = true;
      else if (
        ['head', 'tail'].includes(command) &&
        /^-[nc]$|^--(?:lines|bytes)$/.test(arg)
      )
        i++;
      continue;
    }
    if (!scriptSeen) {
      scriptSeen = true;
      continue;
    }
    paths.push(arg);
  }
  return paths;
};

// Small lexer for literal command arguments; it never performs expansion.
const tokenize = command => {
  const tokens = [];
  let word = '';
  let quote = null;
  const flush = () => {
    if (word) tokens.push({ value: word, operator: false });
    word = '';
  };
  for (let i = 0; i < command.length; i++) {
    const char = command[i];
    if (char === '\\' && quote !== "'") {
      if (i + 1 >= command.length) return null;
      const next = command[++i];
      if (next !== '\n') word += next;
    } else if (quote) {
      if (char === quote) quote = null;
      else word += char;
    } else if (char === '"' || char === "'") quote = char;
    else if (char === '#' && !word) {
      while (i + 1 < command.length && command[i + 1] !== '\n') i++;
    } else if (/[;&|<>()\n]/.test(char)) {
      flush();
      const pair = command.slice(i, i + 2);
      const paired = ['&&', '||', '>>', '<<'].includes(pair);
      const value = paired ? pair : char;
      if (paired) i++;
      tokens.push({ value, operator: true });
    } else if (/\s/.test(char)) flush();
    else word += char;
  }
  if (quote) return null;
  flush();
  return tokens;
};

export const getSkillName = (content, path) => {
  const frontmatter = content
    .replace(/^\uFEFF/, '')
    .match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
  const raw = frontmatter?.match(/^name:[ \t]*(.+)$/m)?.[1]?.trim();
  const match = raw?.match(
    /^(?:"([^"\n]+)"|'([^'\n]+)'|([^\s#]+))(?:\s+#.*)?\s*$/,
  );
  return (
    match?.[1] ||
    match?.[2] ||
    match?.[3] ||
    basename(dirname(path))
  ).toLowerCase();
};
