export class AssertionError extends Error {
  override readonly name = 'AssertionError' as const;
}

export const isAssertionError = (error: unknown): error is AssertionError => {
  return error instanceof AssertionError;
};
