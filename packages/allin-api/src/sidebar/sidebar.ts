/**
 * Sidebar API
 * Manage sidebar panels (left/right panel UI)
 */

import type { ReactNode } from 'react';

export interface Sidebar {
  /*
   * @returns Unregister function
   */
  add(id: string, item: SidebarItem): () => void;
  /**
   * Remove a specific panel
   */
  remove(id: string): void;
  // List all registered panel IDs
  list(): string[];
  // Check if a specific panel exists
  has(id: string): boolean;
  open(id: string): void;
  close(id: string): void;
  toggle(id: string): void;
}

export interface SidebarItem {
  title: string;
  /** Panel icon component or icon name */
  icon?: ReactNode | string;
  view: ({
    id,
    close,
    isOpen,
  }: {
    id: string;
    /** Function to close the panel */
    close: () => void;
    /** Whether the panel is currently open */
    isOpen: boolean;
  }) => ReactNode;
  /** Panel options */
  options?: {
    position?: 'left' | 'right';
    width?: number | string;
    className?: string;
    /** Badge content (e.g., notification count) */
    badge?: string | number;
  };
}
