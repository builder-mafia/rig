use tauri::AppHandle;

use super::oauth;
use super::token_store::{self, CodexAuthStatus};

#[tauri::command]
pub async fn start_codex_oauth(app: AppHandle) -> Result<CodexAuthStatus, String> {
    let pkce = oauth::generate_pkce();
    let state = oauth::generate_state();
    let redirect = oauth::redirect_uri();

    let auth_url = oauth::build_authorize_url(&redirect, &pkce, &state);

    // Open browser for user authentication
    open::that(&auth_url).map_err(|e| format!("Failed to open browser: {}", e))?;

    // Wait for OAuth callback (up to 5 minutes)
    let code = oauth::wait_for_callback(oauth::OAUTH_PORT, &state).await?;

    // Exchange authorization code for tokens
    let tokens = oauth::exchange_code_for_tokens(&code, &redirect, &pkce).await?;

    // Extract account_id from JWT claims
    let account_id = oauth::extract_account_id(&tokens);

    let expires_at = chrono::Utc::now().timestamp() + tokens.expires_in.unwrap_or(3600);

    let auth = token_store::CodexAuth {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        account_id: account_id.clone(),
        expires_at,
    };

    token_store::save_codex_auth(&app, &auth)?;

    log::info!("Codex OAuth completed successfully");

    Ok(CodexAuthStatus::Connected { account_id })
}

#[tauri::command]
pub async fn get_codex_auth_status(app: AppHandle) -> Result<CodexAuthStatus, String> {
    Ok(token_store::get_auth_status(&app))
}

#[tauri::command]
pub async fn revoke_codex_auth(app: AppHandle) -> Result<(), String> {
    token_store::delete_codex_auth(&app)?;
    log::info!("Codex auth revoked");
    Ok(())
}
