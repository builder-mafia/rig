import type { Nullable } from './nullable';

export const assertDefined = (
  condition: Nullable<unknown>,
  message: string,
): condition is NonNullable<typeof condition> => {
  if (!condition) {
    throw new Error(message);
  }
  return true;
};
