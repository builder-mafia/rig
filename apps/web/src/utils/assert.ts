export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new AssertionError(message);
  }
}

export class AssertionError extends Error {
  public static id = 'AssertionError';

  constructor(message: string) {
    super(message);
    this.name = AssertionError.id;
  }
}
