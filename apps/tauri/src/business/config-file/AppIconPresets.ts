export const APPLICATION_ICON_PRESETS = [
  {
    id: 'alacritty',
    label: 'Alacritty',
    light: '/application_icon/alacritty.png',
    dark: '/application_icon/alacritty.png',
  },
  {
    id: 'aws',
    label: 'AWS',
    light: '/application_icon/aws-light.webp',
    dark: '/application_icon/aws-dark.webp',
  },
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
    id: 'cursor',
    label: 'Cursor',
    light: '/application_icon/cursor.png',
    dark: '/application_icon/cursor.png',
  },
  {
    id: 'docker',
    label: 'Docker',
    light: '/application_icon/docker.webp',
    dark: '/application_icon/docker.webp',
  },
  {
    id: 'emacs',
    label: 'Emacs',
    light: '/application_icon/emacs.webp',
    dark: '/application_icon/emacs.webp',
  },
  {
    id: 'finder',
    label: 'Finder',
    light: '/application_icon/finder.png',
    dark: '/application_icon/finder.png',
  },
  {
    id: 'ghostty',
    label: 'Ghostty',
    light: '/application_icon/ghostty.webp',
    dark: '/application_icon/ghostty.webp',
  },
  {
    id: 'git',
    label: 'git',
    light: '/application_icon/github-dark.webp',
    dark: '/application_icon/github-light.webp',
  },
  {
    id: 'helix',
    label: 'Helix',
    light: '/application_icon/helix.webp',
    dark: '/application_icon/helix.webp',
  },
  {
    id: 'jetbrains',
    label: 'JetBrains',
    light: '/application_icon/jetbrain.webp',
    dark: '/application_icon/jetbrain.webp',
  },
  {
    id: 'k9s',
    label: 'k9s',
    light: '/application_icon/k9s.png',
    dark: '/application_icon/k9s.png',
  },
  {
    id: 'neovim',
    label: 'Neovim',
    light: '/application_icon/neovim.jpg',
    dark: '/application_icon/neovim.jpg',
  },
  {
    id: 'npm',
    label: 'npm',
    light: '/application_icon/npm.webp',
    dark: '/application_icon/npm.webp',
  },
  {
    id: 'nushell',
    label: 'Nushell',
    light: '/application_icon/nushell.png',
    dark: '/application_icon/nushell.png',
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
    id: 'poetry',
    label: 'Poetry',
    light: '/application_icon/poetry.png',
    dark: '/application_icon/poetry.png',
  },
  {
    id: 'python',
    label: 'Python',
    light: '/application_icon/python.webp',
    dark: '/application_icon/python.webp',
  },
  {
    id: 'rust',
    label: 'Rust',
    light: '/application_icon/rust-light.webp',
    dark: '/application_icon/rust-dark.webp',
  },
  {
    id: 'opencode',
    label: 'OpenCode',
    light: '/application_icon/opencode-light.webp',
    dark: '/application_icon/opencode-dark.webp',
  },
  {
    id: 'ssh',
    label: 'SSH',
    light: '/application_icon/ssh.png',
    dark: '/application_icon/ssh.png',
  },
  {
    id: 'terminal',
    label: 'Terminal',
    light: '/application_icon/terminal.webp',
    dark: '/application_icon/terminal.webp',
  },
  {
    id: 'zsh',
    label: 'zsh',
    light: '/application_icon/terminal.webp',
    dark: '/application_icon/terminal.webp',
  },
  {
    id: 'starship',
    label: 'Starship',
    light: '/application_icon/starship.png',
    dark: '/application_icon/starship.png',
  },
  {
    id: 'terraform',
    label: 'Terraform',
    light: '/application_icon/terraform.webp',
    dark: '/application_icon/terraform.webp',
  },
  {
    id: 'vim',
    label: 'Vim',
    light: '/application_icon/vim.webp',
    dark: '/application_icon/vim.webp',
  },
  {
    id: 'zed',
    label: 'Zed',
    light: '/application_icon/zed.png',
    dark: '/application_icon/zed.png',
  },
  {
    id: 'windsurf',
    label: 'Windsurf',
    light: '/application_icon/windsurf.svg',
    dark: '/application_icon/windsurf.svg',
  },
  {
    id: 'zellij',
    label: 'Zellij',
    light: '/application_icon/zellij.png',
    dark: '/application_icon/zellij.png',
  },
  {
    id: 'vscode',
    label: 'VSCode',
    light: '/application_icon/vscode.webp',
    dark: '/application_icon/vscode.webp',
  },
  {
    id: 'shell',
    label: 'Shell',
    light: '/application_icon/shell-light.webp',
    dark: '/application_icon/shell-dark.webp',
  },
] as const;

export const getApplicationIconPreset = (presetId: string) => {
  return APPLICATION_ICON_PRESETS.find(preset => preset.id === presetId);
};

export const getApplicationIconUrl = (
  presetId: string,
  isDarkMode: boolean = false,
) => {
  const preset = getApplicationIconPreset(presetId);

  if (!preset) {
    return null;
  }

  return isDarkMode ? preset.dark : preset.light;
};
