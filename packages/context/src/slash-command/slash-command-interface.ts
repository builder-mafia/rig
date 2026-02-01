export interface SlashCommand {
  add: (command: SlashCommandItem) => void;
  remove: (id: string) => void;
  list: () => Exclude<SlashCommandItem, 'action'>[];
}

export interface SlashCommandItem {
  id: string;
  name: string;
  description: string;
  action: () => void;
}
