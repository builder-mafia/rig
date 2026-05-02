import { invoke } from '@tauri-apps/api/core';

type AppType = 'finder' | 'opencode' | 'cursor' | 'zed';

export const useAppOpener = () => {
  const openApp = (type: AppType, path: string) => {
    switch (type) {
      case 'finder':
        return invoke('open_config_file_folder', { path });
      case 'opencode':
        return invoke('open_config_file_in_opencode', { path });
      case 'cursor':
        return invoke('open_config_file_in_cursor', { path });
      case 'zed':
        return invoke('open_config_file_in_zed', { path });
    }
  };

  return {
    openApp,
  };
};
