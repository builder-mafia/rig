import { StateSubject } from '@allin/utils';
import type { Observable } from 'rxjs';

/**
 * Manages the state of the chat input. (Singleton)
 */
export class ChatInputState {
  private static instance: ChatInputState;

  public static getInstance(): ChatInputState {
    if (!ChatInputState.instance) {
      ChatInputState.instance = new ChatInputState();
    }
    return ChatInputState.instance;
  }

  private value$ = new StateSubject<string>('');

  public getValue$(): Observable<string> {
    return this.value$.asObservable();
  }

  public setValue(value: string): void {
    this.value$.next(value);
  }

  public getValue(): string {
    return this.value$.getValue();
  }

  public reset(): void {
    this.value$.next('');
  }
}
