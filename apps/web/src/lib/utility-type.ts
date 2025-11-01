export type ElementType<T> = T extends (infer U)[] ? U : T;

/**
 * Search and Replacement must be 1 lenght.
 *
 * @example
 * type HelloWorld = Replace<'Foo', 'F', 'B'>; // Boo
 * type WithSlashes = Replace<'1-1', '-', ' '>; // 1 1
 */
export type Replace<
  T extends string,
  Search extends string,
  Replacement extends string,
> = T extends `${infer Target}${infer Rest}`
  ? Target extends Search
    ? `${Replacement}${Replace<Rest, Search, Replacement>}`
    : `${Target}${Replace<Rest, Search, Replacement>}`
  : T;
