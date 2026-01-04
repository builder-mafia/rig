import type { ReactNode } from 'react';

export interface Modal {
  open(view: ModalView, options?: ModalOpenOptions): string;
  closeAll(): void;
}

export type ModalView = (props: ModalViewProps) => ReactNode;

export interface ModalViewProps {
  close: () => void;
}

export interface ModalOpenOptions {
  /** Modal size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /**
   * @default true
   */
  closeOnBackdropClick?: boolean;
  /**
   * @default true
   */
  closeOnEscape?: boolean;
  className?: string;
}
