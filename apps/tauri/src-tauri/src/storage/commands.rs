use super::{
    entities::{Channel, Message},
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
