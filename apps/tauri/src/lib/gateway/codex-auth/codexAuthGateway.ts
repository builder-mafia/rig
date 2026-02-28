import { invoke } from '@tauri-apps/api/core';

// Matches Rust CodexAuthStatus enum (serde: camelCase + tag="status")
export type CodexAuthStatus =
  | { status: 'connected'; accountId: string | null }
  | { status: 'expired' }
  | { status: 'notConnected' };

export const codexAuthGateway = {
  startOAuth: () => invoke<CodexAuthStatus>('start_codex_oauth'),
  getStatus: () => invoke<CodexAuthStatus>('get_codex_auth_status'),
  revoke: () => invoke<void>('revoke_codex_auth'),
};
