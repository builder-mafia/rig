import type { ExtensionContext } from '@allin/context';
import type { Extension } from '@allin/extension';
import Quiz from '@allin/extension-quiz';
import { Subject } from 'rxjs';

let isInitialized = false;

export const extensionLoaded$ = new Subject<{
  id: string;
  name: string;
}>();
export const extensionActivate$ = new Subject<{
  id: string;
  name: string;
}>();
export const extensionDeactivate$ = new Subject<{
  id: string;
  name: string;
}>();
export const extensionOpen$ = new Subject<{
  id: string;
  name: string;
}>();
export const extensionClose$ = new Subject<{
  id: string;
  name: string;
}>();

export const loadExtensions = (
  context: ExtensionContext,
): ReturnType<Extension>[] => {
  if (isInitialized) {
    return [];
    // throw new Error('Extensions already loaded');
  }

  const quizExtension = Quiz(context);
  extensionLoaded$.next({
    id: 'quiz',
    name: 'quiz',
  });

  extensionActivate$.next({
    id: 'quiz',
    name: 'quiz',
  });

  isInitialized = true;

  return [quizExtension];
};
