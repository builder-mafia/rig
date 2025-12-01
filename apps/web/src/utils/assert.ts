import type { Nullable } from './types';

export function assertDefined<T>(
  condition: Nullable<T>,
  message: string,
): asserts condition is NonNullable<T> {
  if (!condition) {
    throw new Error(message);
  }
}
