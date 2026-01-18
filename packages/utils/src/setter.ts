export type Setter<T> = T | ((prev: T) => T);

/**
 * @example
 *
 * // function setter
 * const value = 1;
 * const setter = (prev: number) => prev + 1;
 * const newValue = setValueOrFn(value, setter);
 * console.log(newValue); // 2
 *
 * // value setter
 * const value = 1;
 * const setter = 2;
 * const newValue = setValueOrFn(value, setter);
 * console.log(newValue); // 2
 *
 */
export const setValueOrFn = <T>(prevValue: T, setter: Setter<T>) => {
  return typeof setter === 'function'
    ? (setter as (prev: T) => T)(prevValue)
    : setter;
};
