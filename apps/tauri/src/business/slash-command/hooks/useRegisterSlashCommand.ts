import { useEffect } from 'react';
import { useService } from '@/business/ServiceContext';
import { OpenNewChatCommand } from '../commands/OpenNewChatCommand';
import { TranslateCommand } from '../commands/TranslateCommand';

export const useRegisterSlashCommand = () => {
  const { slashCommandManager } = useService();

  useEffect(() => {
    slashCommandManager.registerCommands([
      new TranslateCommand(),
      new OpenNewChatCommand(),
    ]);
  }, [slashCommandManager]);
};
