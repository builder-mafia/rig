use chrono::Utc;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri_plugin_keyring::KeyringExt;

use crate::api_key::constants::{CODEX_AUTH_KEY_NAME, KEYRING_SERVICE};
use crate::auth::oauth;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CodexAuth {
    pub access_token: String,
    pub refresh_token: String,
    pub account_id: Option<String>,
    /// Unix timestamp in seconds
    pub expires_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", tag = "status")]
pub enum CodexAuthStatus {
    Connected { account_id: Option<String> },
    Expired,
    NotConnected,
}

impl CodexAuth {
    pub fn is_expired(&self) -> bool {
        Utc::now().timestamp() >= self.expires_at
    }
}

// -- Keyring Operations --

pub fn save_codex_auth(app: &AppHandle, auth: &CodexAuth) -> Result<(), String> {
    let json = serde_json::to_string(auth).map_err(|e| e.to_string())?;
    app.keyring()
        .set_password(KEYRING_SERVICE, CODEX_AUTH_KEY_NAME, &json)
        .map_err(|e| format!("Failed to save Codex auth to keyring: {}", e))
}

pub fn load_codex_auth(app: &AppHandle) -> Result<CodexAuth, String> {
    let json = app
        .keyring()
        .get_password(KEYRING_SERVICE, CODEX_AUTH_KEY_NAME)
        .map_err(|e| format!("Failed to read Codex auth from keyring: {}", e))?
        .ok_or_else(|| {
            "Codex not authenticated. Please log in with your ChatGPT account.".to_string()
        })?;
    serde_json::from_str(&json).map_err(|e| format!("Failed to parse stored Codex auth: {}", e))
}

pub fn delete_codex_auth(app: &AppHandle) -> Result<(), String> {
    let _ = app
        .keyring()
        .delete_password(KEYRING_SERVICE, CODEX_AUTH_KEY_NAME);
    Ok(())
}

pub fn get_auth_status(app: &AppHandle) -> CodexAuthStatus {
    match load_codex_auth(app) {
        Ok(auth) => {
            if auth.is_expired() {
                CodexAuthStatus::Expired
            } else {
                CodexAuthStatus::Connected {
                    account_id: auth.account_id,
                }
            }
        }
        Err(_) => CodexAuthStatus::NotConnected,
    }
}

pub async fn get_or_refresh(app: &AppHandle) -> Result<CodexAuth, String> {
    let mut auth = load_codex_auth(app)?;

    if !auth.is_expired() {
        return Ok(auth);
    }

    log::info!("Codex access token expired, refreshing...");

    let tokens = oauth::refresh_access_token(&auth.refresh_token).await?;

    // Extract account_id before moving fields out of tokens
    let new_account_id = oauth::extract_account_id(&tokens);

    auth.access_token = tokens.access_token;
    auth.refresh_token = tokens.refresh_token;
    auth.expires_at = Utc::now().timestamp() + tokens.expires_in.unwrap_or(3600);

    if let Some(new_id) = new_account_id {
        auth.account_id = Some(new_id);
    }

    save_codex_auth(app, &auth)?;
    log::info!("Codex access token refreshed successfully");

    Ok(auth)
}
