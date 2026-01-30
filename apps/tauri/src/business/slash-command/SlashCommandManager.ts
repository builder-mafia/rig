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

  getCommands$(): Observable<SlashCommand[]> {
    return this.commands$.asObservable();
  }

  getCommands(): SlashCommand[] {
    return this.commands$.getValue();
  }

  getFilteredCommands(query: string): SlashCommand[] {
    const commands = this.getCommands();
    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery) {
      return commands.filter(cmd => cmd.enabled !== false);
    }

    return commands
      .filter(cmd => cmd.enabled !== false)
      .filter(cmd => {
        const nameMatch = cmd.name.toLowerCase().includes(normalizedQuery);
        const descMatch = cmd.description
          .toLowerCase()
          .includes(normalizedQuery);
        const keywordMatch = cmd.keywords?.some(k =>
          k.toLowerCase().includes(normalizedQuery),
        );
        return nameMatch || descMatch || keywordMatch;
      });
  }

  registerCommand(command: SlashCommand): void {
    const currentCommands = this.commands$.getValue();
    const exists = currentCommands.some(cmd => cmd.id === command.id);

    if (exists) {
      return;
    }

    this.commands$.next([...currentCommands, command]);
  }

  registerCommands(commands: SlashCommand[]): void {
    for (const cmd of commands) {
      this.registerCommand(cmd);
    }
  }

  unregisterCommand(id: string): void {
    const currentCommands = this.commands$.getValue();
    this.commands$.next(currentCommands.filter(cmd => cmd.id !== id));
  }

  resolveTemplate(
    command: TemplateSlashCommand,
    args: string,
    hintSelection?: string,
  ): string {
    let resolved = command.template;

    if (hintSelection) {
      resolved = resolved.replace('$1', hintSelection);
    }

    resolved = resolved.replace('$ARGUMENTS', args);

    const positionalArgs = args.split(/\s+/);
    for (let i = 0; i < positionalArgs.length; i++) {
      resolved = resolved.replaceAll(`$${i + 1}`, positionalArgs[i]);
    }

    return resolved;
  }
}

export const slashCommandManager = SlashCommandManager.getInstance();
