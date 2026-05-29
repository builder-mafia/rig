import { invoke } from '@tauri-apps/api/core';
import { Data, Effect } from 'effect';
import { SkillRootSchema, SkillSchema } from './types';

export class ListSkillRootsError extends Data.TaggedError(
  'ListSkillRootsError',
)<{
  kind: 'InvokeError' | 'ZodParseError';
  cause: unknown;
}> {}

export const listSkillRoots = Effect.fn('listSkillRoots')(function* () {
  const result = yield* Effect.tryPromise({
    try: () => invoke<unknown>('list_skill_roots'),
    catch: error =>
      new ListSkillRootsError({ kind: 'InvokeError', cause: error }),
  });

  return yield* Effect.try({
    try: () => SkillRootSchema.array().parse(result),
    catch: error =>
      new ListSkillRootsError({ kind: 'ZodParseError', cause: error }),
  });
});

export class ListSkillsError extends Data.TaggedError('ListSkillsError')<{
  kind: 'InvokeError' | 'ZodParseError';
  rootPath: string;
  cause: unknown;
}> {}

export const listSkills = Effect.fn('listSkills')(function* (rootPath: string) {
  const result = yield* Effect.tryPromise({
    try: () => invoke<unknown>('list_skills', { rootPath }),
    catch: error =>
      new ListSkillsError({ kind: 'InvokeError', rootPath, cause: error }),
  });

  return yield* Effect.try({
    try: () => SkillSchema.array().parse(result),
    catch: error =>
      new ListSkillsError({
        kind: 'ZodParseError',
        rootPath,
        cause: error,
      }),
  });
});
