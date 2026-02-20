import { TemplateCommand } from '../ISlashCommand';

export class TranslateCommand extends TemplateCommand {
  public id = 'translate';
  public commandName = 'translate';
  public description = 'Translate the text';
  public template = 'Translate the following to $HINT:\n\n$ARGS';
  public hints = ['Korean', 'English', 'French', 'Japanese', 'Chinese'];
}
