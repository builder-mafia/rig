import type { Event } from '@allin/context';
import { filter } from 'rxjs';
import {
  extensionActivate$,
  extensionClose$,
  extensionDeactivate$,
  extensionLoaded$,
  extensionOpen$,
} from '@/extension/loader';

export const EventImpl: Event = {
  'extension.loaded': id => extensionLoaded$.pipe(filter(e => e.id === id)),
  'extension.activate': id => extensionActivate$.pipe(filter(e => e.id === id)),
  'extension.deactivate': id =>
    extensionDeactivate$.pipe(filter(e => e.id === id)),
  'extension.open': id => extensionOpen$.pipe(filter(e => e.id === id)),
  'extension.close': id => extensionClose$.pipe(filter(e => e.id === id)),
};
