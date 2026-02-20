import { useAgentInit } from './chatting/hooks/useAgentInit';
import { useRegisterSlashCommand } from './slash-command/hooks/useRegisterSlashCommand';

export const Initializer = () => {
  useAgentInit();
  useRegisterSlashCommand();

  return null;
};
