use tauri::AppHandle;
use tauri_plugin_keyring::KeyringExt;

use super::constants::KEYRING_SERVICE;

use crate::provider::Provider;

fn get_key_name(provider_name: &str) -> Result<&'static str, String> {
    let provider: Provider = provider_name.parse()?;
    Ok(provider.key_name())
}

#[tauri::command]
pub async fn save_api_key(
    app: AppHandle,
    provider_name: String,
    api_key: String,
) -> Result<(), String> {
    let key_name = get_key_name(&provider_name)?;
    app.keyring()
        .set_password(KEYRING_SERVICE, key_name, &api_key)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_api_key(app: AppHandle, provider_name: String) -> Result<Option<String>, String> {
    let key_name = get_key_name(&provider_name)?;
    app.keyring()
        .get_password(KEYRING_SERVICE, key_name)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_api_key(app: AppHandle, provider_name: String) -> Result<(), String> {
    let key_name = get_key_name(&provider_name)?;
    // delete_credential may fail if no password exists, but we don't care
    let _ = app
        .keyring()
        .delete_password(KEYRING_SERVICE, key_name);
    Ok(())
}

#[tauri::command]
pub async fn has_api_key(app: AppHandle, provider_name: String) -> Result<bool, String> {
    let key_name = get_key_name(&provider_name)?;
    app.keyring()
        .get_password(KEYRING_SERVICE, key_name)
        .map(|opt| opt.is_some())
        .map_err(|e| e.to_string())
}
