import { useEffect } from 'react';
import { useAgentInit } from './chatting/hooks/useAgentInit';
import { useHotKey } from './hotkey/useHotKey';
import { useRegisterSlashCommand } from './slash-command/hooks/useRegisterSlashCommand';

export const Initializer = () => {
  useAgentInit();
  useRegisterSlashCommand();

  // const modW$ = useHotKey('mod+w');
  // useEffect(() => {
  //   const sub = modW$.subscribe(e => {
  //     e.originalEvent.preventDefault();
  //     // window.close();
  //   });
  //   return () => sub.unsubscribe();
  // }, [modW$]);

  return null;
};
