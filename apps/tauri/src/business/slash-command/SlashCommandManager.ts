import { BehaviorSubject, type Observable } from 'rxjs';
import type { SlashCommand, TemplateSlashCommand } from './types';

export class SlashCommandManager {
  private static instance: SlashCommandManager;
  private commands$ = new BehaviorSubject<SlashCommand[]>([]);

  private constructor() {}

  static getInstance(): SlashCommandManager {
    if (!SlashCommandManager.instance) {
      SlashCommandManager.instance = new SlashCommandManager();
    }
    return SlashCommandManager.instance;
  }

  public getCommands$(): Observable<SlashCommand[]> {
    return this.commands$.asObservable();
  }

  public getCommands(): SlashCommand[] {
    return this.commands$.getValue();
  }

  public registerCommand(command: SlashCommand): void {
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

  public resolveTemplate(
    command: TemplateSlashCommand,
    args: string,
    hintSelection?: string,
  ): string {
    let resolved = command.template;

    if (hintSelection) {
      resolved = resolved.replace('$1', hintSelection);
    }

    resolved = resolved.replace('$ALL', args);

    const positionalArgs = args.split(/\s+/);
    for (let i = 0; i < positionalArgs.length; i++) {
      resolved = resolved.replaceAll(`$${i + 1}`, positionalArgs[i]);
    }

    return resolved;
  }
}

export const slashCommandManager = SlashCommandManager.getInstance();
