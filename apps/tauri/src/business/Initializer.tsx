import { useAgentInit } from './chatting/hooks/useAgentInit';
import { useFontApplier } from './font/useFontApplier';
import { useRegisterSlashCommand } from './slash-command/hooks/useRegisterSlashCommand';

export const Initializer = () => {
  useAgentInit();
  useRegisterSlashCommand();
  useFontApplier();

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
