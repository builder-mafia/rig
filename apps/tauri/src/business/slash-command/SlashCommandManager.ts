import { StateSubject } from '@allin/utils';
import {
  type ActionCommand,
  commandNameSchema,
  type SlashCommand,
  type TemplateCommand,
} from './ISlashCommand';

export class SlashCommandManager {
  private static instance: SlashCommandManager;
  private commands$ = new StateSubject<SlashCommand[]>([]);

  private constructor() {}

  static getInstance(): SlashCommandManager {
    if (!SlashCommandManager.instance) {
      SlashCommandManager.instance = new SlashCommandManager();
    }
    return SlashCommandManager.instance;
  }

  public getCommands(): SlashCommand[] {
    return this.commands$.getValue();
  }

  public getTemplateCommands(): TemplateCommand[] {
    return this.commands$.getValue().filter(cmd => cmd.mode === 'template');
  }

  public getActionCommands(): ActionCommand[] {
    return this.commands$.getValue().filter(cmd => cmd.mode === 'action');
  }

  public findCommandByName(name: string): SlashCommand | undefined {
    return this.commands$
      .getValue()
      .find(cmd => cmd.commandName.toLowerCase() === name.toLowerCase());
  }

  public registerCommand(command: SlashCommand): void {
    commandNameSchema.parse(command.commandName);

    const currentCommands = this.commands$.getValue();
    const exists = currentCommands.some(cmd => cmd.id === command.id);

    if (exists) {
      return;
    }

    this.commands$.next([...currentCommands, command]);
  }

  public registerCommands(commands: SlashCommand[]): void {
    for (const cmd of commands) {
      this.registerCommand(cmd);
    }
  }

  public unregisterCommand(id: string): void {
    const currentCommands = this.commands$.getValue();
    this.commands$.next(currentCommands.filter(cmd => cmd.id !== id));
  }
}

export const slashCommandManager = SlashCommandManager.getInstance();
