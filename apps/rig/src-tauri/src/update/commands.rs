use tauri::{AppHandle, State};
use tauri_plugin_updater::UpdaterExt;

use super::models::UpdateMetadata;
use super::state::PendingUpdate;

#[tauri::command]
pub async fn fetch_update(
    app: AppHandle,
    pending_update: State<'_, PendingUpdate>,
) -> Result<Option<UpdateMetadata>, String> {
    let update = app
        .updater_builder()
        .build()
        .map_err(|e| e.to_string())?
        .check()
        .await
        .map_err(|e| e.to_string())?;

    let update_metadata = update.as_ref().map(|update| UpdateMetadata {
        version: update.version.clone(),
        current_version: update.current_version.clone(),
    });

    let mut guard = pending_update
        .0
        .lock()
        .map_err(|_| "Pending update state poisoned".to_string())?;
    *guard = update;

    Ok(update_metadata)
}

#[tauri::command]
pub async fn install_update(
    app: AppHandle,
    pending_update: State<'_, PendingUpdate>,
) -> Result<(), String> {
    let update = {
        let mut guard = pending_update
            .0
            .lock()
            .map_err(|_| "Pending update state poisoned".to_string())?;
        guard
            .take()
            .ok_or_else(|| "No pending update. Run check for updates first.".to_string())?
    };

    update
        .download_and_install(|_, _| {}, || {})
        .await
        .map_err(|e| e.to_string())?;

    app.restart();
}
