#!/usr/bin/env bash

set -euo pipefail

SCRIPT_SOURCE="${BASH_SOURCE[0]:-$0}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${SCRIPT_SOURCE}")" && pwd)"
APP_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${APP_DIR}/.env.release.local"

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  source "${ENV_FILE}"
  set +a
fi

export TAURI_PRIVATE_KEY="${TAURI_SIGNING_PRIVATE_KEY:-}"
export TAURI_PRIVATE_KEY_PASSWORD="${TAURI_SIGNING_PRIVATE_KEY_PASSWORD:-}"

if [[ -z "${TAURI_SIGNING_PRIVATE_KEY:-}" && -z "${TAURI_PRIVATE_KEY:-}" ]]; then
  echo "TAURI_SIGNING_PRIVATE_KEY is required. Set it in .env.release.local or your shell env."
  return 1 2>/dev/null || exit 1
fi

if [[ -z "${APPLE_SIGNING_IDENTITY}" ]]; then
  echo "APPLE_SIGNING_IDENTITY is required. Set it in .env.release.local or your shell env."
  return 1 2>/dev/null || exit 1
fi

has_apple_id_creds=true
if [[ -z "${APPLE_ID:-}" || -z "${APPLE_PASSWORD:-}" || -z "${APPLE_TEAM_ID:-}" ]]; then
  has_apple_id_creds=false
fi

if [[ "${has_apple_id_creds}" != true ]]; then
  echo "Provide notarization credentials in .env.release.local or your shell env."
  return 1 2>/dev/null || exit 1
fi
