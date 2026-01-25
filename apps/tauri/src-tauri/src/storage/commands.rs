use super::{
    types::{Channel, Message},
    Storage,
};
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
