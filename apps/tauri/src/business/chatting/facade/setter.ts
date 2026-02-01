export type Setter<T> = T | ((prev: T) => T);

export function setValueOrFn<T>(prev: T, setter: Setter<T>): T {
  if (typeof setter === 'function') {
    return (setter as (prev: T) => T)(prev);
  }
  return setter;
}
