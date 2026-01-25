pub mod commands;
pub mod types;

use serde::{de::DeserializeOwned, Serialize};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

pub struct Storage {
    base_path: PathBuf,
}

impl Storage {
    pub fn new(app: &AppHandle) -> Self {
        let base_path = app
            .path()
            .app_data_dir()
            .expect("Failed to get app data dir")
            .join("storage");

        Self { base_path }
    }

    fn get_path(&self, keys: &[&str]) -> PathBuf {
        let mut path = self.base_path.clone();
        for key in keys {
            path = path.join(key);
        }
        path.with_extension("json")
    }

    pub async fn read<T: DeserializeOwned>(&self, keys: &[&str]) -> Result<T, String> {
        let path = self.get_path(keys);
        let content = tokio::fs::read_to_string(&path)
            .await
            .map_err(|e| format!("Failed to read file: {}", e))?;
        serde_json::from_str(&content).map_err(|e| format!("Failed to parse JSON: {}", e))
    }

    pub async fn write<T: Serialize>(&self, keys: &[&str], content: &T) -> Result<(), String> {
        let path = self.get_path(keys);

        // Ensure parent directory exists
        if let Some(parent) = path.parent() {
            tokio::fs::create_dir_all(parent)
                .await
                .map_err(|e| format!("Failed to create directory: {}", e))?;
        }

        let json = serde_json::to_string_pretty(content)
            .map_err(|e| format!("Failed to serialize: {}", e))?;
        tokio::fs::write(&path, json)
            .await
            .map_err(|e| format!("Failed to write file: {}", e))
    }

    pub async fn remove(&self, keys: &[&str]) -> Result<(), String> {
        let path = self.get_path(keys);
        tokio::fs::remove_file(&path)
            .await
            .map_err(|e| format!("Failed to remove file: {}", e))
    }

    pub async fn remove_dir(&self, keys: &[&str]) -> Result<(), String> {
        let mut path = self.base_path.clone();
        for key in keys {
            path = path.join(key);
        }
        tokio::fs::remove_dir_all(&path)
            .await
            .map_err(|e| format!("Failed to remove directory: {}", e))
    }

    pub async fn list_dirs(&self, prefix: &[&str]) -> Result<Vec<String>, String> {
        let mut path = self.base_path.clone();
        for key in prefix {
            path = path.join(key);
        }

        // Return empty vec if directory doesn't exist
        if !path.exists() {
            return Ok(Vec::new());
        }

        let mut entries = tokio::fs::read_dir(&path)
            .await
            .map_err(|e| format!("Failed to read directory: {}", e))?;

        let mut dirs = Vec::new();
        while let Some(entry) = entries
            .next_entry()
            .await
            .map_err(|e| format!("Failed to read entry: {}", e))?
        {
            if entry
                .file_type()
                .await
                .map_err(|e| format!("Failed to get file type: {}", e))?
                .is_dir()
            {
                if let Some(name) = entry.file_name().to_str() {
                    dirs.push(name.to_string());
                }
            }
        }

        Ok(dirs)
    }

    // Channel operations
    pub async fn get_all_channels(&self) -> Result<Vec<types::Channel>, String> {
        let channel_ids = self.list_dirs(&["channel"]).await.unwrap_or_default();

        let mut channels = Vec::new();
        for id in channel_ids {
            if let Ok(info) = self.read::<types::Channel>(&["channel", &id, "info"]).await {
                channels.push(info);
            }
        }

        // Sort by updatedAt descending
        channels.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
        Ok(channels)
    }

    pub async fn get_channel(&self, id: &str) -> Result<types::Channel, String> {
        self.read(&["channel", id, "info"]).await
    }

    pub async fn create_channel(&self, info: &types::Channel) -> Result<(), String> {
        self.write(&["channel", &info.id, "info"], info).await
    }

    pub async fn update_channel(&self, info: &types::Channel) -> Result<(), String> {
        self.write(&["channel", &info.id, "info"], info).await
    }

    pub async fn delete_channel(&self, id: &str) -> Result<(), String> {
        self.remove_dir(&["channel", id]).await
    }

    // Message operations
    pub async fn get_messages(&self, channel_id: &str) -> Result<Vec<types::Message>, String> {
        match self
            .read::<types::MessagesFile>(&["channel", channel_id, "messages"])
            .await
        {
            Ok(file) => Ok(file.messages),
            Err(_) => Ok(Vec::new()), // Return empty if file doesn't exist
        }
    }

    pub async fn save_messages(
        &self,
        channel_id: &str,
        messages: &[types::Message],
    ) -> Result<(), String> {
        println!("save_messages: {:?}", messages);
        let file = types::MessagesFile {
            messages: messages.to_vec(),
        };
        self.write(&["channel", channel_id, "messages"], &file)
            .await
    }
}
