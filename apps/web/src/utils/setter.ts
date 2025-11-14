export type Setter<T> = T | ((prev: T) => T);

export const setValueOrFn = <T>(prevValue: T, setter: Setter<T>) => {
  return typeof setter === 'function'
    ? (setter as (prev: T) => T)(prevValue)
    : setter;
};
