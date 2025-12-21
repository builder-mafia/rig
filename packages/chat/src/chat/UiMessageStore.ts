import type { UIMessage } from 'ai';
import { BehaviorSubject, type Observable } from 'rxjs';
import type { UIMessageMetadata } from '@allin/message-metadata-schema';
import { type Setter, setValueOrFn } from '../utils/setter';

/**
 * This class stores displayed messages.
 */
export class UIMessageStore<
  UI_MESSAGE extends
    UIMessage<UIMessageMetadata> = UIMessage<UIMessageMetadata>,
> {
  private messages$ = new BehaviorSubject<UI_MESSAGE[]>([]);

  public getUiMessages(): UI_MESSAGE[] {
    return this.messages$.getValue();
  }

  public getUiMessages$(): Observable<UI_MESSAGE[]> {
    return this.messages$.asObservable();
  }

  public setUiMessages(setter: Setter<UI_MESSAGE[]>) {
    const newMessages = setValueOrFn(this.messages$.getValue(), setter);
    this.messages$.next(newMessages);
  }
}
