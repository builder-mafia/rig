export type ApplicationIconPreset = {
  id: string;
  label: string;
  light: string;
  dark: string;
};

export const APPLICATION_ICON_PRESETS: ApplicationIconPreset[] = [
  {
    id: 'chrome',
    label: 'Chrome',
    light: '/application_icon/chrome.webp',
    dark: '/application_icon/chrome.webp',
  },
  {
    id: 'claude',
    label: 'Claude',
    light: '/application_icon/claude-ai.svg',
    dark: '/application_icon/claude-ai.svg',
  },
  {
    id: 'clawd',
    label: 'Clawd',
    light: '/application_icon/clawd.webp',
    dark: '/application_icon/clawd.webp',
  },
  {
    id: 'ghostty',
    label: 'Ghostty',
    light: '/application_icon/ghostty.webp',
    dark: '/application_icon/ghostty.webp',
  },
  {
    id: 'ollama',
    label: 'Ollama',
    light: '/application_icon/ollama.webp',
    dark: '/application_icon/ollama.webp',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    light: '/application_icon/openai.webp',
    dark: '/application_icon/openai.webp',
  },
  {
    id: 'opencode',
    label: 'OpenCode',
    light: '/application_icon/opencode-light.webp',
    dark: '/application_icon/opencode-dark.webp',
  },
  {
    id: 'terminal',
    label: 'Terminal',
    light: '/application_icon/terminal.webp',
    dark: '/application_icon/terminal.webp',
  },
  {
    id: 'zed',
    label: 'Zed',
    light: '/application_icon/zed.png',
    dark: '/application_icon/zed.png',
  },
  {
    id: 'vscode',
    label: 'vscode',
    light: '/application_icon/vscode.webp',
    dark: '/application_icon/vscode.webp',
  },
];

export const getApplicationIconPreset = (presetId: string) => {
  return (
    APPLICATION_ICON_PRESETS.find(preset => preset.id === presetId) ?? null
  );
};

export const getApplicationIconUrl = (
  presetId: string,
  isDarkMode: boolean,
) => {
  const preset = getApplicationIconPreset(presetId);
  if (!preset) {
    return null;
  }

  return isDarkMode ? preset.dark : preset.light;
};
