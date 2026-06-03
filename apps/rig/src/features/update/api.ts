import { invoke } from '@tauri-apps/api/core';
import { Data, Effect } from 'effect';
import { UpdateMetadataSchema } from './types';

export class FetchUpdateError extends Data.TaggedError('FetchUpdateError')<{
  kind: 'InvokeError' | 'ZodParseError';
  cause: unknown;
}> {}

export const fetchUpdate = Effect.fn('fetchUpdate')(function* () {
  const result = yield* Effect.tryPromise({
    try: () => invoke<unknown>('fetch_update'),
    catch: error =>
      new FetchUpdateError({ kind: 'InvokeError', cause: error }),
  });

  if (result == null) {
    return null;
  }

  return yield* Effect.try({
    try: () => UpdateMetadataSchema.parse(result),
    catch: error =>
      new FetchUpdateError({ kind: 'ZodParseError', cause: error }),
  });
});

export class InstallUpdateError extends Data.TaggedError('InstallUpdateError')<{
  kind: 'InvokeError';
  cause: unknown;
}> {}

export const installUpdate = Effect.fn('installUpdate')(function* () {
  yield* Effect.tryPromise({
    try: () => invoke<void>('install_update'),
    catch: error =>
      new InstallUpdateError({ kind: 'InvokeError', cause: error }),
  });
});
