import { Fzf } from 'fzf';
import { useMemo } from 'react';
import { useService } from '@/business/ServiceContext';
import type { SlashCommand } from '../ISlashCommand';

/**
 * @example
 *
 * commands = [
 *   { commandName: 'alpha' },
 *   { commandName: 'ummpha'}
 * ]
 *
 * query : pha => [alpha, ummpha]
 * query : al => [alpha]
 * query : mm => [ummpha]
 */
export const useSlashCommandSearch = (query: string) => {
  const { slashCommandManager } = useService();
  const commands = useMemo(() => {
    return slashCommandManager.getCommands();
  }, [slashCommandManager]);

  const FZF = useMemo(
    () =>
      new Fzf(commands, { selector: (cmd: SlashCommand) => cmd.commandName }),
    [commands],
  );

  return useMemo(() => {
    return query ? FZF.find(query).map(result => result.item) : commands;
  }, [FZF, commands, query]);
};
