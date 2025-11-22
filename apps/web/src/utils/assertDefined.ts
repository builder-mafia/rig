import type { Nullable } from './nullable';

export function assertDefined<T>(
  condition: Nullable<T>,
  message: string,
): asserts condition is NonNullable<T> {
  if (!condition) {
    throw new Error(message);
  }
}
