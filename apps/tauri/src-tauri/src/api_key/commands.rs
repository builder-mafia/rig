use tauri::AppHandle;
use tauri_plugin_keyring::KeyringExt;

use serde::{Deserialize, Serialize};

use super::constants::{KEYRING_SERVICE, PROVIDER_API_KEYS_KEY_NAME};

use crate::provider::Provider;

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ProviderApiKeys {
    openai: Option<String>,
    google: Option<String>,
    anthropic: Option<String>,
    vercel: Option<String>,
}

impl ProviderApiKeys {
    fn get(&self, provider: Provider) -> Option<String> {
        match provider {
            Provider::OpenAI => self.openai.clone(),
            Provider::Google => self.google.clone(),
            Provider::Anthropic => self.anthropic.clone(),
            Provider::Vercel => self.vercel.clone(),
            Provider::Codex => None,
        }
    }

    fn set(&mut self, provider: Provider, api_key: String) {
        match provider {
            Provider::OpenAI => self.openai = Some(api_key),
            Provider::Google => self.google = Some(api_key),
            Provider::Anthropic => self.anthropic = Some(api_key),
            Provider::Vercel => self.vercel = Some(api_key),
            Provider::Codex => {}
        }
    }

    fn delete(&mut self, provider: Provider) {
        match provider {
            Provider::OpenAI => self.openai = None,
            Provider::Google => self.google = None,
            Provider::Anthropic => self.anthropic = None,
            Provider::Vercel => self.vercel = None,
            Provider::Codex => {}
        }
    }
}

fn load_provider_api_keys(app: &AppHandle) -> Result<ProviderApiKeys, String> {
    let json = app
        .keyring()
        .get_password(KEYRING_SERVICE, PROVIDER_API_KEYS_KEY_NAME)
        .map_err(|e| e.to_string())?;

    match json {
        Some(value) => serde_json::from_str(&value).map_err(|e| e.to_string()),
        None => Ok(ProviderApiKeys::default()),
    }
}

fn save_provider_api_keys(app: &AppHandle, provider_api_keys: &ProviderApiKeys) -> Result<(), String> {
    let json = serde_json::to_string(provider_api_keys).map_err(|e| e.to_string())?;
    app.keyring()
        .set_password(KEYRING_SERVICE, PROVIDER_API_KEYS_KEY_NAME, &json)
        .map_err(|e| e.to_string())
}

pub fn get_provider_api_key(app: &AppHandle, provider: Provider) -> Result<Option<String>, String> {
    if let Provider::Codex = provider {
        return Ok(None);
    }

    let provider_api_keys = load_provider_api_keys(app)?;
    Ok(provider_api_keys.get(provider))
}

#[tauri::command]
pub async fn save_api_key(
    app: AppHandle,
    provider_name: String,
    api_key: String,
) -> Result<(), String> {
    let provider: Provider = provider_name.parse()?;

    if let Provider::Codex = provider {
        return Err("Codex API key is not supported. Use OAuth login instead.".to_string());
    }

    let mut provider_api_keys = load_provider_api_keys(&app)?;
    provider_api_keys.set(provider, api_key);
    save_provider_api_keys(&app, &provider_api_keys)
}

#[tauri::command]
pub async fn delete_api_key(app: AppHandle, provider_name: String) -> Result<(), String> {
    let provider: Provider = provider_name.parse()?;

    if let Provider::Codex = provider {
        return Err("Codex API key is not supported. Use OAuth login instead.".to_string());
    }

    let mut provider_api_keys = load_provider_api_keys(&app)?;
    provider_api_keys.delete(provider);
    save_provider_api_keys(&app, &provider_api_keys)
}

#[tauri::command]
pub async fn has_api_key(app: AppHandle, provider_name: String) -> Result<bool, String> {
    let provider: Provider = provider_name.parse()?;
    get_provider_api_key(&app, provider).map(|opt| opt.is_some())
}
