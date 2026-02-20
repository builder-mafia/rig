import { describe, expect, it } from 'vitest';
import { TemplateCommand } from '@/business/slash-command/ISlashCommand';
import { getTargetTemplateCommand } from './getTargetTemplateCommand';

class TestCommand extends TemplateCommand {
  public id: string;
  public commandName: string;
  public description = 'test';
  public template = '$INPUT';
  public hints?: string[];

  constructor(commandName: string) {
    super();
    this.id = commandName;
    this.commandName = commandName;
  }
}

const commands = [new TestCommand('translate'), new TestCommand('summary')];

describe('getTargetTemplateCommand', () => {
  it('returns matching command for /translate hello world', () => {
    const result = getTargetTemplateCommand('/translate', commands);

    expect(result?.id).toBe('translate');
  });

  it('returns matching command for /summary some contexts', () => {
    const result = getTargetTemplateCommand('/summary', commands);

    expect(result?.id).toBe('summary');
  });

  it('returns null when input does not start with /', () => {
    const result = getTargetTemplateCommand('translate', commands);

    expect(result).toBeNull();
  });

  it('returns null when no command matches', () => {
    const result = getTargetTemplateCommand('/unknown', commands);

    expect(result).toBeNull();
  });

  it('returns null when input does not start with /', () => {
    const result = getTargetTemplateCommand(' /translate', commands);

    expect(result).toBeNull();
  });

  it('returns matching command for case-insensitive input', () => {
    const result = getTargetTemplateCommand('/Translate', commands);

    expect(result?.id).toBe('translate');
  });
});
