import { invoke } from '@tauri-apps/api/core';
import type { AppUpdateMetadata } from './types';

export const appUpdateGateway = {
  fetch: () => invoke<AppUpdateMetadata | null>('fetch_update'),
  install: () => invoke<void>('install_update'),
};
