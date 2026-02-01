import type { ReactNode } from 'react';

type SlashCommandBase = {
  id: string;
  name: string;
  description: string;
  icon?: ReactNode;
  keywords?: string[];
  enabled?: boolean;
};

export type ActionSlashCommand = SlashCommandBase & {
  mode: 'action';
  execute: (context: SlashCommandContext) => void | Promise<void>;
};

export type TemplateSlashCommand = SlashCommandBase & {
  mode: 'template';
  template: string;
  hints?: string[];
};

export type SlashCommand = ActionSlashCommand | TemplateSlashCommand;

export type SlashCommandContext = {
  currentInput: string;
  setInput: (value: string) => void;
  close: () => void;
};
