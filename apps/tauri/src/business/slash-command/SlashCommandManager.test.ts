import { afterEach, describe, expect, it } from 'vitest';
import { SlashCommandManager } from './SlashCommandManager';
import type { SlashCommand, TemplateSlashCommand } from './types';

function setup() {
  const manager = SlashCommandManager.getInstance();
  // Clear all existing commands
  for (const cmd of manager.getCommands()) {
    manager.unregisterCommand(cmd.id);
  }
  return manager;
}

describe('SlashCommandManager', () => {
  afterEach(() => {
    const manager = SlashCommandManager.getInstance();
    for (const cmd of manager.getCommands()) {
      manager.unregisterCommand(cmd.id);
    }
  });

  describe('resolveTemplate', () => {
    it('replaces $INPUT with provided args', () => {
      const manager = setup();
      const command: TemplateSlashCommand = {
        id: 'test-1',
        name: 'Test',
        description: 'Test command',
        mode: 'template',
        template: 'Do: $INPUT',
      };

      const result = manager.resolveTemplate(command, 'hello');

      expect(result).toBe('Do: hello');
    });

    it('replaces both $INPUT and $HINT when hintSelection is provided', () => {
      const manager = setup();
      const command: TemplateSlashCommand = {
        id: 'test-2',
        name: 'Translate',
        description: 'Translate command',
        mode: 'template',
        template: 'To $HINT:\n\n$INPUT',
      };

      const result = manager.resolveTemplate(command, 'hello world', 'Korean');

      expect(result).toBe('To Korean:\n\nhello world');
    });

    it('leaves $HINT unreplaced when hintSelection is not provided', () => {
      const manager = setup();
      const command: TemplateSlashCommand = {
        id: 'test-3',
        name: 'Translate',
        description: 'Translate command',
        mode: 'template',
        template: 'To $HINT:\n\n$INPUT',
      };

      const result = manager.resolveTemplate(command, 'hello world');

      expect(result).toBe('To $HINT:\n\nhello world');
    });

    it('replaces only first $INPUT placeholder (replace behavior)', () => {
      const manager = setup();
      const command: TemplateSlashCommand = {
        id: 'test-4',
        name: 'Repeat',
        description: 'Repeat command',
        mode: 'template',
        template: '$INPUT and $INPUT',
      };

      const result = manager.resolveTemplate(command, 'test');

      expect(result).toBe('test and $INPUT');
    });

    it('handles empty args', () => {
      const manager = setup();
      const command: TemplateSlashCommand = {
        id: 'test-5',
        name: 'Empty',
        description: 'Empty command',
        mode: 'template',
        template: 'Result: $INPUT',
      };

      const result = manager.resolveTemplate(command, '');

      expect(result).toBe('Result: ');
    });

    it('handles template with no placeholders', () => {
      const manager = setup();
      const command: TemplateSlashCommand = {
        id: 'test-6',
        name: 'Static',
        description: 'Static command',
        mode: 'template',
        template: 'Static text',
      };

      const result = manager.resolveTemplate(command, 'ignored');

      expect(result).toBe('Static text');
    });
  });

  describe('findCommandByName', () => {
    it('returns command with exact name match', () => {
      const manager = setup();
      const command: SlashCommand = {
        id: 'cmd-1',
        name: 'Translate',
        description: 'Translate text',
        mode: 'template',
        template: '$INPUT',
      };
      manager.registerCommand(command);

      const result = manager.findCommandByName('Translate');

      expect(result).toEqual(command);
    });

    it('returns command with case-insensitive match', () => {
      const manager = setup();
      const command: SlashCommand = {
        id: 'cmd-2',
        name: 'Translate',
        description: 'Translate text',
        mode: 'template',
        template: '$INPUT',
      };
      manager.registerCommand(command);

      const result = manager.findCommandByName('translate');

      expect(result).toEqual(command);
    });

    it('returns command with mixed case match', () => {
      const manager = setup();
      const command: SlashCommand = {
        id: 'cmd-3',
        name: 'TranslateText',
        description: 'Translate text',
        mode: 'template',
        template: '$INPUT',
      };
      manager.registerCommand(command);

      const result = manager.findCommandByName('TRANSLATETEXT');

      expect(result).toEqual(command);
    });

    it('returns undefined for nonexistent command', () => {
      const manager = setup();
      const command: SlashCommand = {
        id: 'cmd-4',
        name: 'Translate',
        description: 'Translate text',
        mode: 'template',
        template: '$INPUT',
      };
      manager.registerCommand(command);

      const result = manager.findCommandByName('NonExistent');

      expect(result).toBeUndefined();
    });

    it('returns first matching command when multiple exist', () => {
      const manager = setup();
      const command1: SlashCommand = {
        id: 'cmd-5',
        name: 'Translate',
        description: 'First translate',
        mode: 'template',
        template: '$INPUT',
      };
      const command2: SlashCommand = {
        id: 'cmd-6',
        name: 'Summary',
        description: 'Summary text',
        mode: 'template',
        template: '$INPUT',
      };
      manager.registerCommand(command1);
      manager.registerCommand(command2);

      const result = manager.findCommandByName('translate');

      expect(result).toEqual(command1);
    });

    it('returns undefined when no commands registered', () => {
      const manager = setup();

      const result = manager.findCommandByName('Translate');

      expect(result).toBeUndefined();
    });
  });
});
