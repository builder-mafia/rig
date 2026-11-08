pub mod catalog;
mod editing;
pub mod files;
pub mod manifest;
pub mod models;
mod property;
pub mod store;

use models::*;
use std::path::{Path, PathBuf};
use tauri::Manager;

fn locations(app: &tauri::AppHandle) -> Result<(PathBuf, PathBuf), ConfigError> {
    Ok((
        app.path()
            .app_data_dir()
            .map_err(|_| error("registryFailed", "Plugin storage is unavailable."))?,
        app.path()
            .home_dir()
            .map_err(|_| error("readFailed", "Home directory is unavailable."))?,
    ))
}

async fn blocking<T: Send + 'static>(
    work: impl FnOnce() -> Result<T, ConfigError> + Send + 'static,
) -> Result<T, ConfigError> {
    tauri::async_runtime::spawn_blocking(work)
        .await
        .map_err(|_| error("readFailed", "Configuration operation failed."))?
}

#[tauri::command]
pub async fn list_config_plugins(app: tauri::AppHandle) -> Result<Vec<PluginSummary>, ConfigError> {
    blocking(move || {
        let (directory, home) = locations(&app)?;
        store::list(&directory, &home)
    })
    .await
}

#[tauri::command]
pub async fn install_config_plugin(
    app: tauri::AppHandle,
    plugin_id: String,
) -> Result<(), ConfigError> {
    blocking(move || {
        let (directory, _) = locations(&app)?;
        store::install(&directory, &plugin_id)
    })
    .await
}

#[tauri::command]
pub async fn remove_config_plugin(
    app: tauri::AppHandle,
    plugin_id: String,
) -> Result<(), ConfigError> {
    blocking(move || {
        let (directory, _) = locations(&app)?;
        store::remove(&directory, &plugin_id)
    })
    .await
}

#[tauri::command]
pub async fn preview_config_plugin(
    app: tauri::AppHandle,
    manifest_path: String,
) -> Result<manifest::PluginPreview, ConfigError> {
    blocking(move || {
        let (_, home) = locations(&app)?;
        let (plugin, revision) = manifest::load(Path::new(&manifest_path))?;
        Ok(manifest::PluginPreview {
            plugin: manifest::summary(&plugin, false, false, &home),
            revision,
        })
    })
    .await
}

#[tauri::command]
pub async fn import_config_plugin(
    app: tauri::AppHandle,
    manifest_path: String,
    expected_revision: String,
) -> Result<String, ConfigError> {
    blocking(move || {
        let (directory, _) = locations(&app)?;
        store::import(&directory, Path::new(&manifest_path), &expected_revision)
    })
    .await
}

#[tauri::command]
pub async fn read_config_file(
    app: tauri::AppHandle,
    plugin_id: String,
    file_id: String,
) -> Result<ConfigDocument, ConfigError> {
    blocking(move || {
        let (directory, home) = locations(&app)?;
        let plugin = store::find_installed(&directory, &plugin_id)?;
        files::read_document(plugin_file(&plugin, &file_id)?, &home)
    })
    .await
}

#[tauri::command]
pub async fn save_config_file(
    app: tauri::AppHandle,
    plugin_id: String,
    file_id: String,
    expected_revision: Option<String>,
    edit: ConfigEdit,
) -> Result<ConfigDocument, ConfigError> {
    blocking(move || {
        let (directory, home) = locations(&app)?;
        let plugin = store::find_installed(&directory, &plugin_id)?;
        editing::save_document(
            plugin_file(&plugin, &file_id)?,
            &home,
            expected_revision.as_deref(),
            edit,
        )
    })
    .await
}

fn plugin_file<'a>(plugin: &'a ConfigPlugin, file_id: &str) -> Result<&'a ConfigFile, ConfigError> {
    plugin
        .files
        .iter()
        .find(|file| file.id == file_id)
        .ok_or_else(|| error("notFound", "Configuration file not found."))
}

#[cfg(test)]
mod tests;
