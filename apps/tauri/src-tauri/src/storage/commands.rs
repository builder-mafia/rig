use super::{
    entities::{Channel, ConfigFile, Group, Message},
    external_file::{
        check_local_path as check_external_local_path, read_text_file,
        resolve_local_path, write_text_file, LocalPathCheckInput,
        LocalPathCheckResult,
    },
    Storage,
};
use crate::storage::entities::{Agent, AppSettings};
use std::process::Command;
use tauri::AppHandle;

fn resolve_config_target_path(path: &str) -> Result<std::path::PathBuf, String> {
    resolve_local_path(path)
}

fn resolve_config_target_directory(path: &str) -> Result<std::path::PathBuf, String> {
    let resolved_path = resolve_config_target_path(path)?;

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

    Ok(target_directory)
}

fn shell_escape(value: &str) -> String {
    format!("'{}'", value.replace('\'', "'\\''"))
}

fn run_open_command(args: &[&str]) -> Result<(), String> {
    let status = Command::new("open")
        .args(args)
        .status()
        .map_err(|e| e.to_string())?;

    if status.success() {
        return Ok(());
    }

    Err(format!("open command failed with status: {}", status))
}

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
pub async fn get_groups(app: AppHandle) -> Result<Vec<Group>, String> {
    let storage = Storage::new(&app);
    storage.get_groups().await
}

#[tauri::command]
pub async fn create_config_file(app: AppHandle, config_file: ConfigFile) -> Result<(), String> {
    let storage = Storage::new(&app);
    storage.create_config_file(&config_file).await
}

#[tauri::command]
pub async fn create_group(app: AppHandle, group: Group) -> Result<Group, String> {
    let storage = Storage::new(&app);
    storage.create_group(&group).await
}

#[tauri::command]
pub async fn check_local_path(input: LocalPathCheckInput) -> Result<LocalPathCheckResult, String> {
    Ok(check_external_local_path(&input.path))
}

#[tauri::command]
pub async fn update_config_file(app: AppHandle, config_file: ConfigFile) -> Result<(), String> {
    let storage = Storage::new(&app);
    storage.update_config_file(&config_file).await
}

#[tauri::command]
pub async fn update_group(app: AppHandle, group: Group) -> Result<(), String> {
    let storage = Storage::new(&app);
    storage.update_group(&group).await
}

#[tauri::command]
pub async fn delete_config_file(app: AppHandle, id: String) -> Result<(), String> {
    let storage = Storage::new(&app);
    storage.delete_config_file(&id).await
}

#[tauri::command]
pub async fn delete_group(app: AppHandle, id: String) -> Result<(), String> {
    let storage = Storage::new(&app);
    storage.delete_group(&id).await
}

#[tauri::command]
pub async fn read_file(path: String) -> Result<String, String> {
    read_text_file(&path).await
}

#[tauri::command]
pub async fn write_file(path: String, content: String) -> Result<(), String> {
    write_text_file(&path, &content).await
}

#[tauri::command]
pub async fn open_config_file_folder(path: String) -> Result<(), String> {
    let resolved_path = resolve_config_target_path(&path)?;

    if resolved_path.is_dir() {
        return run_open_command(&[resolved_path.to_string_lossy().as_ref()]);
    }

    if !resolved_path.exists() {
        return Err("The target file does not exist".to_string());
    }

    run_open_command(&["-R", resolved_path.to_string_lossy().as_ref()])
}

#[tauri::command]
pub async fn open_config_file_in_opencode(path: String) -> Result<(), String> {
    let target_directory = resolve_config_target_directory(&path)?;
    let command = format!(
        "cd {} && opencode; exec zsh",
        shell_escape(target_directory.to_string_lossy().as_ref())
    );

    run_open_command(&[
        "-n",
        "-a",
        "Ghostty",
        "--args",
        "-e",
        "zsh",
        "-lc",
        command.as_str(),
    ])
}

#[tauri::command]
pub async fn open_config_file_in_zed(path: String) -> Result<(), String> {
    let resolved_path = resolve_config_target_path(&path)?;

    if !resolved_path.exists() {
        return Err("The target path does not exist".to_string());
    }

    run_open_command(&["-a", "Zed", resolved_path.to_string_lossy().as_ref()])
}

#[tauri::command]
pub async fn open_config_file_in_cursor(path: String) -> Result<(), String> {
    let resolved_path = resolve_config_target_path(&path)?;

    if !resolved_path.exists() {
        return Err("The target path does not exist".to_string());
    }

    run_open_command(&["-a", "Cursor", resolved_path.to_string_lossy().as_ref()])
}
