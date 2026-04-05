use super::{
    entities::{Channel, ConfigFile, Message},
    Storage,
};
use crate::storage::entities::{Agent, AppSettings};
use tauri::AppHandle;

#[tauri::command]
pub async fn get_channels(app: AppHandle) -> Result<Vec<Channel>, String> {
    let storage = Storage::new(&app);
    storage.get_all_channels().await
}

#[tauri::command]
pub async fn get_channel(app: AppHandle, id: String) -> Result<Channel, String> {
    let storage = Storage::new(&app);
    storage.get_channel(&id).await
}

#[tauri::command]
pub async fn create_channel(app: AppHandle, info: Channel) -> Result<(), String> {
    let storage = Storage::new(&app);
    storage.create_channel(&info).await
}

#[tauri::command]
pub async fn update_channel(app: AppHandle, info: Channel) -> Result<(), String> {
    let storage = Storage::new(&app);
    storage.update_channel(&info).await
}

#[tauri::command]
pub async fn delete_channel(app: AppHandle, id: String) -> Result<(), String> {
    let storage = Storage::new(&app);
    storage.delete_channel(&id).await
}

#[tauri::command]
pub async fn get_messages(app: AppHandle, channel_id: String) -> Result<Vec<Message>, String> {
    let storage = Storage::new(&app);
    storage.get_messages(&channel_id).await
}

#[tauri::command]
pub async fn append_message(
    app: AppHandle,
    channel_id: String,
    message: Message,
) -> Result<(), String> {
    let storage = Storage::new(&app);
    storage.append_message(&channel_id, &message).await
}

#[tauri::command]
pub async fn upsert_message(
    app: AppHandle,
    channel_id: String,
    message: Message,
) -> Result<(), String> {
    let storage = Storage::new(&app);
    storage.upsert_message(&channel_id, &message).await
}

#[tauri::command]
pub async fn save_messages(
    app: AppHandle,
    channel_id: String,
    messages: Vec<Message>,
) -> Result<(), String> {
    let storage = Storage::new(&app);
    storage.save_messages(&channel_id, &messages).await
}

#[tauri::command]
pub async fn get_all_agents(app: AppHandle) -> Result<Vec<Agent>, String> {
    let storage = Storage::new(&app);
    storage.get_all_agents().await
}

#[tauri::command]
pub async fn get_agent(app: AppHandle, id: String) -> Result<Agent, String> {
    let storage = Storage::new(&app);
    storage.get_agent(&id).await
}

#[tauri::command]
pub async fn create_agent(app: AppHandle, agent: Agent) -> Result<(), String> {
    let storage = Storage::new(&app);
    storage.create_agent(&agent).await
}

#[tauri::command]
pub async fn update_agent(app: AppHandle, agent: Agent) -> Result<(), String> {
    let storage = Storage::new(&app);
    storage.update_agent(&agent).await
}

#[tauri::command]
pub async fn delete_agent(app: AppHandle, id: String) -> Result<(), String> {
    let storage = Storage::new(&app);
    storage.delete_agent(&id).await
}

#[tauri::command]
pub async fn get_app_settings(app: AppHandle) -> Result<AppSettings, String> {
    let storage = Storage::new(&app);
    storage.get_app_settings().await
}

#[tauri::command]
pub async fn save_app_settings(app: AppHandle, settings: AppSettings) -> Result<(), String> {
    let storage = Storage::new(&app);
    storage.save_app_settings(&settings).await
}

#[tauri::command]
pub async fn get_config_files(app: AppHandle) -> Result<Vec<ConfigFile>, String> {
    let storage = Storage::new(&app);
    storage.get_config_files().await
}

#[tauri::command]
pub async fn create_config_file(app: AppHandle, config_file: ConfigFile) -> Result<(), String> {
    let storage = Storage::new(&app);
    storage.create_config_file(&config_file).await
}

#[tauri::command]
pub async fn update_config_file(app: AppHandle, config_file: ConfigFile) -> Result<(), String> {
    let storage = Storage::new(&app);
    storage.update_config_file(&config_file).await
}

#[tauri::command]
pub async fn delete_config_file(app: AppHandle, id: String) -> Result<(), String> {
    let storage = Storage::new(&app);
    storage.delete_config_file(&id).await
}

#[tauri::command]
pub async fn read_config_file(app: AppHandle, path: String) -> Result<String, String> {
    let storage = Storage::new(&app);
    storage.read_config_file(&path).await
}

#[tauri::command]
pub async fn write_config_file(
    app: AppHandle,
    path: String,
    content: String,
) -> Result<(), String> {
    let storage = Storage::new(&app);
    storage.write_config_file(&path, &content).await
}

#[tauri::command]
pub async fn list_config_directory_entries(
    app: AppHandle,
    path: String,
) -> Result<Vec<super::entities::ConfigDirectoryEntry>, String> {
    let storage = Storage::new(&app);
    storage.list_config_directory_entries(&path).await
}

#[tauri::command]
pub async fn open_config_file_folder(path: String) -> Result<(), String> {
    let resolved_path = Storage::resolve_local_path(&path)?;

    let target_directory = if resolved_path.is_dir() {
        resolved_path
    } else {
        resolved_path
            .parent()
            .ok_or_else(|| "Could not determine parent folder for the file".to_string())?
            .to_path_buf()
    };

    if !target_directory.exists() {
        return Err("The target folder does not exist".to_string());
    }

    open::that(target_directory).map_err(|e| e.to_string())
}
