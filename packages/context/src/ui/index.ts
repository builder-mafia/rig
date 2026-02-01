import type { ReactNode } from 'react';

export interface UI {
  render(props: {
    id: string;
    component: ReactNode;
    onClose?: () => void;
  }): void;
  close(id: string): void;
}
