import type { AUI } from '@allin/context';
import { RootViewRenderComponent$ } from '@/app/business/RootView';

export const AUIImpl: AUI = {
  render: props => {
    RootViewRenderComponent$.next(props);
  },
  close: id => {
    RootViewRenderComponent$.next(null);
  },
};
