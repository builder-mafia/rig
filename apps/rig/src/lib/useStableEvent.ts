import { useCallback, useLayoutEffect, useRef } from 'react';

// Event identity stays stable while handlers see the latest committed state.
export const useStableEvent = <Args extends unknown[], Result>(
  handler: (...args: Args) => Result,
) => {
  const current = useRef(handler);
  useLayoutEffect(() => {
    current.current = handler;
  }, [handler]);
  return useCallback((...args: Args) => current.current(...args), []);
};
