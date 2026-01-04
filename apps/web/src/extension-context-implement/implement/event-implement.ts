import type { Event } from '@allin/context';
import { Subject } from 'rxjs';

export const EventImpl: Event = {
  'extension.loaded': new Subject<{
    id: string;
    name: string;
  }>(),
  'extension.activate': new Subject<{
    id: string;
    name: string;
  }>(),
  'extension.deactivate': new Subject<{
    id: string;
    name: string;
  }>(),
  'extension.open': new Subject<{
    id: string;
    name: string;
  }>(),
  'extension.close': new Subject<{
    id: string;
    name: string;
  }>(),
};
