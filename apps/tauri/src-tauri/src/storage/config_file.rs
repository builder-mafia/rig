use super::{entities, Storage};

impl Storage {
    pub async fn get_config_files(&self) -> Result<Vec<entities::ConfigFile>, String> {
        match self.read::<entities::ConfigFilesFile>(&["config_file"]).await {
            Ok(file) => {
                let mut config_files = file.config_files;
                config_files.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
                Ok(config_files)
            }
            Err(error) => {
                if error.contains("No such file or directory") {
                    Ok(Vec::new())
                } else {
                    Err(error)
                }
            }
        }
    }

    pub async fn create_config_file(&self, config_file: &entities::ConfigFile) -> Result<(), String> {
        self.validate_existing_config_file_path(&config_file.path, config_file.is_directory)?;

        let mut config_files = self.get_config_files().await?;

        if config_files.iter().any(|item| item.id == config_file.id) {
            return Err(format!("Config file already exists: {}", config_file.id));
        }

        config_files.push(config_file.clone());
        self.save_config_files(&config_files).await
    }

    pub async fn update_config_file(&self, config_file: &entities::ConfigFile) -> Result<(), String> {
        self.validate_existing_config_file_path(&config_file.path, config_file.is_directory)?;

        let mut config_files = self.get_config_files().await?;

        if let Some(existing) = config_files.iter_mut().find(|item| item.id == config_file.id) {
            *existing = config_file.clone();
        } else {
            return Err(format!("Config file not found: {}", config_file.id));
        }

        self.save_config_files(&config_files).await
    }

    pub async fn delete_config_file(&self, id: &str) -> Result<(), String> {
        let config_files = self.get_config_files().await?;
        let filtered: Vec<_> = config_files.into_iter().filter(|item| item.id != id).collect();
        self.save_config_files(&filtered).await
    }

    async fn save_config_files(&self, config_files: &[entities::ConfigFile]) -> Result<(), String> {
        let file = entities::ConfigFilesFile {
            config_files: config_files.to_vec(),
        };
        self.write(&["config_file"], &file).await
    }

    pub async fn list_config_directory_entries(
        &self,
        path: &str,
    ) -> Result<Vec<entities::ConfigDirectoryEntry>, String> {
        let resolved_path = Self::resolve_local_path(path)?;

        if !resolved_path.exists() {
            return Err(format!(
                "Directory does not exist: {}",
                resolved_path.display()
            ));
        }

        if !resolved_path.is_dir() {
            return Err(format!(
                "Path is not a directory: {}",
                resolved_path.display()
            ));
        }

        let mut entries = Vec::new();
        let mut read_dir = tokio::fs::read_dir(&resolved_path)
            .await
            .map_err(|e| format!("Failed to read directory {}: {}", resolved_path.display(), e))?;

        while let Some(entry) = read_dir
            .next_entry()
            .await
            .map_err(|e| format!("Failed to read directory entry {}: {}", resolved_path.display(), e))?
        {
            let entry_path = entry.path();
            let metadata = entry
                .metadata()
                .await
                .map_err(|e| format!("Failed to read metadata {}: {}", entry_path.display(), e))?;

            let is_directory = if metadata.is_dir() {
                true
            } else if metadata.is_file() {
                false
            } else {
                continue;
            };

            entries.push(entities::ConfigDirectoryEntry {
                name: entry.file_name().to_string_lossy().to_string(),
                path: entry_path.to_string_lossy().to_string(),
                is_directory,
            });
        }

        entries.sort_by(|a, b| match (a.is_directory, b.is_directory) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        });

        Ok(entries)
    }

    fn validate_existing_config_file_path(&self, path: &str, is_directory: bool) -> Result<(), String> {
        let resolved_path = Self::resolve_local_path(path)?;

        if !resolved_path.exists() {
            return Err(format!(
                "Config entry does not exist: {}",
                resolved_path.display()
            ));
        }

        if is_directory {
            if !resolved_path.is_dir() {
                return Err(format!(
                    "Path is not a folder: {}",
                    resolved_path.display()
                ));
            }
        } else if !resolved_path.is_file() {
            return Err(format!(
                "Path is not a file: {}",
                resolved_path.display()
            ));
        }

        Ok(())
    }
}
