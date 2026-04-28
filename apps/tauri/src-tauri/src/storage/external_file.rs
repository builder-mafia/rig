use std::path::PathBuf;
use std::time::UNIX_EPOCH;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalPathCheckInput {
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalPathCheckResult {
    pub resolved_path: String,
    pub exists: bool,
    pub created_at: Option<u64>,
    pub updated_at: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct File {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
}

fn to_unix_timestamp_millis(time: std::time::SystemTime) -> Option<u64> {
    time.duration_since(UNIX_EPOCH)
        .ok()
        .and_then(|duration| u64::try_from(duration.as_millis()).ok())
}

pub fn resolve_local_path(path: &str) -> Result<PathBuf, String> {
    let trimmed = path.trim();

    if trimmed.is_empty() {
        return Err("Path is required".to_string());
    }

    let expanded = shellexpand::tilde(trimmed);

    Ok(PathBuf::from(expanded.as_ref()))
}

pub fn check_local_path(path: &str) -> LocalPathCheckResult {
    match resolve_local_path(path) {
        Ok(resolved_path) => match std::fs::metadata(&resolved_path) {
            Ok(metadata) => LocalPathCheckResult {
                resolved_path: resolved_path.to_string_lossy().to_string(),
                exists: true,
                created_at: metadata.created().ok().and_then(to_unix_timestamp_millis),
                updated_at: metadata.modified().ok().and_then(to_unix_timestamp_millis),
            },
            Err(_) => LocalPathCheckResult {
                resolved_path: resolved_path.to_string_lossy().to_string(),
                exists: false,
                created_at: None,
                updated_at: None,
            },
        },
        Err(error) => LocalPathCheckResult {
            resolved_path: error,
            exists: false,
            created_at: None,
            updated_at: None,
        },
    }
}

pub async fn read_text_file(path: &str) -> Result<String, String> {
    let target_path = resolve_local_path(path)?;

    tokio::fs::read_to_string(&target_path)
        .await
        .map_err(|e| format!("Failed to read file {}: {}", target_path.display(), e))
}

pub async fn read_directory_entries(path: &str) -> Result<Vec<File>, String> {
    let target_path = resolve_local_path(path)?;

    if !target_path.exists() {
        return Err(format!(
            "Directory does not exist: {}",
            target_path.display()
        ));
    }

    if !target_path.is_dir() {
        return Err(format!(
            "Path is not a directory: {}",
            target_path.display()
        ));
    }

    let mut read_dir = tokio::fs::read_dir(&target_path)
        .await
        .map_err(|e| format!("Failed to read directory {}: {}", target_path.display(), e))?;
    let mut entries = Vec::new();

    while let Some(entry) = read_dir.next_entry().await.map_err(|e| {
        format!(
            "Failed to read directory entry {}: {}",
            target_path.display(),
            e
        )
    })? {
        let file_type = entry.file_type().await.map_err(|e| {
            format!(
                "Failed to read directory entry type {}: {}",
                entry.path().display(),
                e
            )
        })?;
        let name = entry.file_name().to_string_lossy().to_string();

        entries.push(File {
            name,
            path: entry.path().to_string_lossy().to_string(),
            is_directory: file_type.is_dir(),
        });
    }

    entries.sort_by(|a, b| {
        b.is_directory
            .cmp(&a.is_directory)
            .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });

    Ok(entries)
}

pub async fn write_text_file(path: &str, content: &str) -> Result<(), String> {
    let target_path = resolve_local_path(path)?;

    if !target_path.exists() {
        return Err(format!("File does not exist: {}", target_path.display()));
    }

    if !target_path.is_file() {
        return Err(format!("Path is not a file: {}", target_path.display()));
    }

    tokio::fs::write(&target_path, content)
        .await
        .map_err(|e| format!("Failed to write file {}: {}", target_path.display(), e))
}
