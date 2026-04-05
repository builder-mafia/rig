import { atom, useAtomValue, useSetAtom } from 'jotai';

export type ConfigFileWorkbenchPane = 'content' | 'create-entry';

export const configFileWorkbenchPaneAtom =
  atom<ConfigFileWorkbenchPane>('content');

export const useConfigFileWorkbenchPane = () => {
  const pane = useAtomValue(configFileWorkbenchPaneAtom);
  const setPane = useSetAtom(configFileWorkbenchPaneAtom);

  return {
    pane,
    setPane,
  };
};
