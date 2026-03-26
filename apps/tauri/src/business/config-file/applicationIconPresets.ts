export type ApplicationIconPreset = {
  id: string;
  label: string;
  lightIconUrl: string;
  darkIconUrl: string;
};

export const APPLICATION_ICON_PRESETS: ApplicationIconPreset[] = [
  {
    id: 'chrome',
    label: 'Chrome',
    lightIconUrl: '/application_icon/chrome.webp',
    darkIconUrl: '/application_icon/chrome.webp',
  },
  {
    id: 'claude',
    label: 'Claude',
    lightIconUrl: '/application_icon/claude-ai.svg',
    darkIconUrl: '/application_icon/claude-ai.svg',
  },
  {
    id: 'clawd',
    label: 'Clawd',
    lightIconUrl: '/application_icon/clawd.webp',
    darkIconUrl: '/application_icon/clawd.webp',
  },
  {
    id: 'ghostty',
    label: 'Ghostty',
    lightIconUrl: '/application_icon/ghostty.webp',
    darkIconUrl: '/application_icon/ghostty.webp',
  },
  {
    id: 'ollama',
    label: 'Ollama',
    lightIconUrl: '/application_icon/ollama.webp',
    darkIconUrl: '/application_icon/ollama.webp',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    lightIconUrl: '/application_icon/openai.webp',
    darkIconUrl: '/application_icon/openai.webp',
  },
  {
    id: 'opencode',
    label: 'OpenCode',
    lightIconUrl: '/application_icon/opencode-light.webp',
    darkIconUrl: '/application_icon/opencode-dark.webp',
  },
  {
    id: 'terminal',
    label: 'Terminal',
    lightIconUrl: '/application_icon/terminal.webp',
    darkIconUrl: '/application_icon/terminal.webp',
  },
  {
    id: 'zed',
    label: 'Zed',
    lightIconUrl: '/application_icon/zed.png',
    darkIconUrl: '/application_icon/zed.png',
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

  return isDarkMode ? preset.darkIconUrl : preset.lightIconUrl;
};
