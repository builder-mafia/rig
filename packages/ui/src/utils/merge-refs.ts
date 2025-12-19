import type { ForwardedRef } from 'react';

export function mergeRefs<T>(...refs: (ForwardedRef<T> | undefined | null)[]) {
  return (node: T) => {
    refs.forEach(ref => {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    });
  };
}
