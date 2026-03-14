import { match } from 'ts-pattern';
import type { SlashCommand } from '../ISlashCommand';

export type SlashCommandExecuteResult =
  | { type: 'action'; inputValue?: string }
  | { type: 'template'; inputValue: string };

export const useSlashCommandExecutor = () => {
  const execute = (command: SlashCommand): SlashCommandExecuteResult => {
    return match(command)
      .with({ mode: 'action' }, cmd => {
        // Promise.resolve(cmd.execute(context)).catch(err => {
        //   console.error('Action execute error:', err);
        // });
        return { type: 'action' as const, inputValue: '' };
      })
      .with({ mode: 'template' }, cmd => {
        return {
          type: 'template' as const,
          inputValue: '/' + cmd.commandName + ' ',
        };
      })
      .exhaustive();
  };

  return { execute };
};
