import { describe, expect, it } from 'vitest';
import { TemplateCommand } from './ISlashCommand';

class TestCommand extends TemplateCommand {
  public id = 'test';
  public commandName = 'test';
  public description = 'Test command';
  public template: string;
  public hints?: string[];

  constructor(template: string) {
    super();
    this.template = template;
  }
}

describe('TemplateCommand.toPrompt', () => {
  it('replaces $ARGS with user text after command', () => {
    const command = new TestCommand('Do: $ARGS');

    expect(command.toPrompt('/test hello')).toBe('Do: hello');
  });

  it('replaces both $ARGS and $HINT when hintSelection is provided', () => {
    const command = new TestCommand('To $HINT:\n\n$ARGS');

    expect(command.toPrompt('/test hello world', 'Korean')).toBe(
      'To Korean:\n\nhello world',
    );
  });

  it('replaces $HINT with empty string when hintSelection is not provided', () => {
    const command = new TestCommand('To $HINT:\n\n$ARGS');

    expect(command.toPrompt('/test hello world')).toBe('To :\n\nhello world');
  });

  it('replaces only first $ARGS placeholder', () => {
    const command = new TestCommand('$ARGS and $ARGS');

    expect(command.toPrompt('/test foo')).toBe('foo and $ARGS');
  });

  it('handles input with only command (no user text)', () => {
    const command = new TestCommand('Result: $ARGS');

    expect(command.toPrompt('/test')).toBe('Result: ');
  });

  it('handles template with no placeholders', () => {
    const command = new TestCommand('Static text');

    expect(command.toPrompt('/test ignored')).toBe('Static text');
  });
});
