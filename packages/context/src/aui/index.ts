import type { ReactNode } from 'react';

export interface AUI {
  render(props: {
    id: string;
    component: ReactNode;
    onClose?: () => void;
  }): void;
  close(id: string): void;
}
