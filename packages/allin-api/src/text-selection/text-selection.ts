import type { ReactNode } from 'react';

export type TextSelectionFloatingButtonComponent = (
  props: TextSelectionFloatingButton,
) => ReactNode;

export interface TextSelectionFloatingButton {
  /** Function to close the floating button list */
  close: () => void;
  /** Selected text */
  selectedText?: string;
}

/**
 * Selection Popover API
 * Add custom items to the popover that appears when text is selected
 * The position of the floating button list is determined by the implementation (e.g apps/web)
 */
export interface TextSelectionFloatingButtonList {
  /**
   * Add a new floating button
   * @param id - Unique identifier
   * @param component - React component (provided with close function)
   * @returns Unregister function
   */
  add(id: string, component: TextSelectionFloatingButtonComponent): () => void;

  /**
   * Remove a specific item
   * @param id - ID of the item to remove
   */
  remove(id: string): void;

  /**
   * List all registered item IDs
   */
  list(): string[];

  /**
   * Check if a specific item exists
   */
  has(id: string): boolean;
}
