import { type Observable, take, timeout } from 'rxjs';

export const waitUntil = async (
  observable: Observable<unknown>,
  timeoutMs = 1000 * 30,
) => {
  return new Promise((resolve, reject) => {
    observable.pipe(take(1), timeout(timeoutMs)).subscribe({
      next: () => resolve(true),
      error: error => reject(error),
    });
  });
};
