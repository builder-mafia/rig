import type { UIMessage } from 'ai';
import { BehaviorSubject, type Observable } from 'rxjs';
import { type Setter, setValueOrFn } from '@/utils/setter';

/**
 * UIMessageStore is a store that holds the UI messages to be displayed to the user.
 * This module helps us to handle agent's messages context separately from the UI messages to be displayed to the user.
 */
export class UIMessageStore<UI_MESSAGE extends UIMessage> {
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
