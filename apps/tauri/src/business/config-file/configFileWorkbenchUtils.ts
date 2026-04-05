import type { StorageConfigFile } from '@/lib/gateway/config-file/types';
import { getApplicationIconUrl } from './applicationIconPresets';
import type { ConfigBrowserItem } from './configFileWorkbenchTypes';

export const FINDER_ICON_PATH = '/application_icon/finder.png';
export const ZED_ICON_PATH = '/application_icon/zed.png';

export const getLanguageFromPath = (path: string) => {
  const lowerCasePath = path.toLowerCase();

  if (lowerCasePath.endsWith('.jsonc')) return 'json';
  if (lowerCasePath.endsWith('.json')) return 'json';
  if (lowerCasePath.endsWith('.yaml') || lowerCasePath.endsWith('.yml')) {
    return 'yaml';
  }
  if (lowerCasePath.endsWith('.toml')) return 'toml';
  if (lowerCasePath.endsWith('.zshrc') || lowerCasePath.endsWith('.sh')) {
    return 'shell';
  }
  if (lowerCasePath.endsWith('.md')) return 'markdown';
  return 'plaintext';
};

export const getIconUrl = (
  iconType: StorageConfigFile['iconType'],
  iconValue: string | null,
  isDarkMode: boolean,
) => {
  if (!iconType || !iconValue) {
    return null;
  }

  if (iconType === 'uploaded') {
    return iconValue;
  }

  return getApplicationIconUrl(iconValue, isDarkMode);
};

export const getNameFromPath = (path: string) => {
  const normalizedPath = path.replace(/\/+$|\/+$/g, '');
  return normalizedPath.split('/').at(-1) ?? path;
};

export const toBrowserItem = (
  configFile: StorageConfigFile,
): ConfigBrowserItem => ({
  rootId: configFile.id,
  name: configFile.name,
  path: configFile.path,
  isDirectory: configFile.isDirectory,
});
