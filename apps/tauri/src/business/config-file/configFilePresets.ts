export type ConfigFilePreset = {
  presetId: string;
  name: string;
  path: string;
  isDirectory: boolean;
  iconUrl: string | null;
};

export const CONFIG_FILE_PRESETS: ConfigFilePreset[] = [
  {
    presetId: 'zed-settings',
    name: 'Zed Settings',
    path: '~/.config/zed/settings.json',
    isDirectory: false,
    iconUrl: '/application_icon/zed.png',
  },
  {
    presetId: 'ghostty-config',
    name: 'Ghostty Config',
    path: '~/.config/ghostty/config',
    isDirectory: false,
    iconUrl: '/application_icon/ghostty.webp',
  },
  {
    presetId: 'cursor-settings',
    name: 'Cursor Settings',
    path: '~/Library/Application Support/Cursor/User/settings.json',
    isDirectory: false,
    iconUrl: '/application_icon/cursor.png',
  },
  {
    presetId: 'vscode-settings',
    name: 'VS Code Settings',
    path: '~/Library/Application Support/Code/User/settings.json',
    isDirectory: false,
    iconUrl: '/application_icon/vscode.webp',
  },
];
