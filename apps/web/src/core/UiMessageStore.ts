import type { UIMessage } from 'ai';
import { BehaviorSubject } from 'rxjs';

/**
 * UIMessageStore is a store that holds the UI messages to be displayed to the user.
 * This module helps us to handle agent's messages context separately from the UI messages to be displayed to the user.
 */
export class UIMessageStore<UI_MESSAGE extends UIMessage> {
  private messages$ = new BehaviorSubject<UI_MESSAGE[]>([]);

  public getUiMessages() {
    return this.messages$.getValue();
  }

  public setUiMessages(
    valueOrFn: UI_MESSAGE[] | ((prev: UI_MESSAGE[]) => UI_MESSAGE[]),
  ) {
    const newMessage =
      typeof valueOrFn === 'function'
        ? valueOrFn(this.messages$.getValue())
        : valueOrFn;
    this.messages$.next(newMessage);
  }

  public uiMessages$() {
    return this.messages$.asObservable();
  }
}
