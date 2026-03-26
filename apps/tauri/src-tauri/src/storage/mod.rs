mod agent;
mod channel;
mod config_file;
pub mod commands;
pub mod entities;
mod message;
mod setting;

use serde::{de::DeserializeOwned, Serialize};
use std::{env, path::PathBuf};
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

    /// # Example
    /// get_path(&["channel", "123", "info"])
    /// -> {app_data_dir}/storage/channel/123/info.json
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

    /// Removes a single JSON file.
    /// # Example
    /// storage.remove(&["channel", "abc123", "info"]).await?;
    /// // Deletes: storage/channel/abc123/info.json
    pub async fn remove(&self, keys: &[&str]) -> Result<(), String> {
        let path = self.get_path(keys);
        tokio::fs::remove_file(&path)
            .await
            .map_err(|e| format!("Failed to remove file: {}", e))
    }

    /// Removes a directory and all its contents (cascade delete).
    /// # Example
    /// storage.remove_dir(&["channel", "abc123"]).await?;
    /// // Deletes: storage/channel/abc123/ (including info.json, messages.json)
    pub async fn remove_dir(&self, keys: &[&str]) -> Result<(), String> {
        let mut path = self.base_path.clone();
        for key in keys {
            path = path.join(key);
        }
        tokio::fs::remove_dir_all(&path)
            .await
            .map_err(|e| format!("Failed to remove directory: {}", e))
    }

    /// Lists subdirectory names at 1 depth only (not recursive).
    /// # Example
    /// let channel_ids = storage.list_dirs(&["channel"]).await?;
    /// // Returns: ["abc123", "def456"]
    pub async fn list_dirs(&self, prefix: &[&str]) -> Result<Vec<String>, String> {
        let mut path = self.base_path.clone();
        for key in prefix {
            path = path.join(key);
        }

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

    fn resolve_local_path(path: &str) -> Result<PathBuf, String> {
        let trimmed = path.trim();

        if trimmed.is_empty() {
            return Err("Path is required".to_string());
        }

        if trimmed == "~" {
            return env::var("HOME")
                .map(PathBuf::from)
                .map_err(|_| "Failed to resolve home directory".to_string());
        }

        if let Some(stripped) = trimmed.strip_prefix("~/") {
            let home = env::var("HOME")
                .map_err(|_| "Failed to resolve home directory".to_string())?;
            return Ok(PathBuf::from(home).join(stripped));
        }

        Ok(PathBuf::from(trimmed))
    }

    pub async fn read_config_file(&self, path: &str) -> Result<String, String> {
        let target_path = Self::resolve_local_path(path)?;

        tokio::fs::read_to_string(&target_path)
            .await
            .map_err(|e| format!("Failed to read file {}: {}", target_path.display(), e))
    }

    pub async fn write_config_file(&self, path: &str, content: &str) -> Result<(), String> {
        let target_path = Self::resolve_local_path(path)?;

        if let Some(parent) = target_path.parent() {
            tokio::fs::create_dir_all(parent)
                .await
                .map_err(|e| format!("Failed to create directory {}: {}", parent.display(), e))?;
        }

        tokio::fs::write(&target_path, content)
            .await
            .map_err(|e| format!("Failed to write file {}: {}", target_path.display(), e))
    }
}
