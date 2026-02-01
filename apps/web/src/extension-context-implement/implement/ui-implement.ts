import type { UI } from '@allin/context';
import { RootViewRenderComponent$ } from '@/app/business/RootView';

export const UIImpl: UI = {
  render: props => {
    RootViewRenderComponent$.next(props);
  },
  close: id => {
    RootViewRenderComponent$.next(null);
  },
};
