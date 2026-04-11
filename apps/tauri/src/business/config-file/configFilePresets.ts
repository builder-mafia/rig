export type ConfigFilePreset = {
  presetId: string;
  name: string;
  path: string;
  isDirectory: boolean;
  iconType: 'preset' | 'uploaded' | null;
  iconValue: string | null;
};

export const CONFIG_FILE_PRESETS: ConfigFilePreset[] = [
  {
    presetId: 'zed-settings',
    name: 'Zed Settings',
    path: '~/.config/zed/settings.json',
    isDirectory: false,
    iconType: 'preset',
    iconValue: 'zed',
  },
  {
    presetId: 'ghostty-config',
    name: 'Ghostty Config',
    path: '~/.config/ghostty/config',
    isDirectory: false,
    iconType: 'preset',
    iconValue: 'ghostty',
  },
  {
    presetId: 'cursor-settings',
    name: 'Cursor Settings',
    path: '~/Library/Application Support/Cursor/User/settings.json',
    isDirectory: false,
    iconType: 'preset',
    iconValue: 'cursor',
  },
  {
    presetId: 'vscode-settings',
    name: 'VS Code Settings',
    path: '~/Library/Application Support/Code/User/settings.json',
    isDirectory: false,
    iconType: 'preset',
    iconValue: 'vscode',
  },
];
