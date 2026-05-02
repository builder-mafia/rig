import { match } from 'ts-pattern';

export const getFileTypeFromPath = (path: string) => {
  const lowerCasePath = path.toLowerCase();

  return match(lowerCasePath)
    .when(
      path => path.endsWith('.jsonc'),
      () => 'json',
    )
    .when(
      path => path.endsWith('.json'),
      () => 'json',
    )
    .when(
      path => path.endsWith('.yaml') || path.endsWith('.yml'),
      () => 'yaml',
    )
    .when(
      path => path.endsWith('.toml'),
      () => 'toml',
    )
    .when(
      path => path.endsWith('.zshrc') || path.endsWith('.sh'),
      () => 'shell',
    )
    .when(
      path => path.endsWith('.md'),
      () => 'markdown',
    )
    .otherwise(() => 'plaintext');
};
