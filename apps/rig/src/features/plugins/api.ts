import { invoke } from '@tauri-apps/api/core';
import { Data, Effect } from 'effect';
import {
  PluginInstallErrorSchema,
  PluginTargetSchema,
  type PluginToolId,
} from './types';

export class ListPluginTargetsError extends Data.TaggedError(
  'ListPluginTargetsError',
)<{
  kind: 'InvokeError' | 'ZodParseError';
  cause: unknown;
}> {}

export const listPluginTargets = Effect.fn('listPluginTargets')(function* () {
  const result = yield* Effect.tryPromise({
    try: () => invoke<unknown>('list_plugin_targets'),
    catch: error =>
      new ListPluginTargetsError({ kind: 'InvokeError', cause: error }),
  });

  return yield* Effect.try({
    try: () => PluginTargetSchema.array().parse(result),
    catch: error =>
      new ListPluginTargetsError({ kind: 'ZodParseError', cause: error }),
  });
});

export class InstallPluginTargetError extends Data.TaggedError(
  'InstallPluginTargetError',
)<{
  kind: 'InvokeError' | 'PluginInstallError' | 'ZodParseError';
  cause: unknown;
}> {}

export const installPluginTarget = Effect.fn('installPluginTarget')(function* (
  targetId: PluginToolId,
) {
  const result = yield* Effect.tryPromise({
    try: () => invoke<unknown>('install_plugin_target', { targetId }),
    catch: error => error,
  }).pipe(
    Effect.catchAll(error => {
      const pluginInstallError = parsePluginInstallError(error);

      if (pluginInstallError) {
        return Effect.fail(
          new InstallPluginTargetError({
            kind: 'PluginInstallError',
            cause: pluginInstallError,
          }),
        );
      }

      return Effect.fail(
        new InstallPluginTargetError({ kind: 'InvokeError', cause: error }),
      );
    }),
  );

  return yield* Effect.try({
    try: () => PluginTargetSchema.parse(result),
    catch: error =>
      new InstallPluginTargetError({ kind: 'ZodParseError', cause: error }),
  });
});

const parsePluginInstallError = (error: unknown) => {
  const result = PluginInstallErrorSchema.safeParse(error);

  if (result.success) {
    return result.data;
  }

  if (typeof error === 'string') {
    try {
      return parsePluginInstallError(JSON.parse(error));
    } catch {
      return null;
    }
  }

  return null;
};
