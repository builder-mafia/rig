import type { TemplateCommand } from '@/business/slash-command/ISlashCommand';

export const getTargetTemplateCommand = (
  input: string,
  commands: TemplateCommand[],
): TemplateCommand | null => {
  const firstPhrase = input.split(/\s+/)[0];

  if (!firstPhrase.startsWith('/')) {
    return null;
  }

  const withoutSlash = firstPhrase.slice(1).toLowerCase();

  const matchingCommands = commands.find(
    cmd => withoutSlash === cmd.commandName,
  );

  return matchingCommands || null;
};
