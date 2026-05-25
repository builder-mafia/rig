import { invoke } from '@tauri-apps/api/core';
import { Data, Effect } from 'effect';
import {
  type SkillDetail,
  SkillDetailSchema,
  SkillRootSchema,
  SkillSchema,
} from './types';

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

export class ReadSkillError extends Data.TaggedError('ReadSkillError')<{
  kind: 'InvokeError' | 'ZodParseError';
  rootPath: string;
  relativePath: string;
  cause: unknown;
}> {}

export const readSkill = Effect.fn('readSkill')(function* (input: {
  rootPath: string;
  relativePath: string;
}) {
  const result = yield* Effect.tryPromise({
    try: () => invoke<unknown>('read_skill', input),
    catch: error =>
      new ReadSkillError({
        kind: 'InvokeError',
        rootPath: input.rootPath,
        relativePath: input.relativePath,
        cause: error,
      }),
  });

  return yield* Effect.try({
    try: () => SkillDetailSchema.parse(result),
    catch: error =>
      new ReadSkillError({
        kind: 'ZodParseError',
        rootPath: input.rootPath,
        relativePath: input.relativePath,
        cause: error,
      }),
  });
});
