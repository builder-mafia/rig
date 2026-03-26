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
        self.validate_existing_config_file_path(&config_file.path)?;

        let mut config_files = self.get_config_files().await?;

        if config_files.iter().any(|item| item.id == config_file.id) {
            return Err(format!("Config file already exists: {}", config_file.id));
        }

        config_files.push(config_file.clone());
        self.save_config_files(&config_files).await
    }

    pub async fn update_config_file(&self, config_file: &entities::ConfigFile) -> Result<(), String> {
        self.validate_existing_config_file_path(&config_file.path)?;

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

    fn validate_existing_config_file_path(&self, path: &str) -> Result<(), String> {
        let resolved_path = Self::resolve_local_path(path)?;

        if !resolved_path.exists() {
            return Err(format!(
                "Config file does not exist: {}",
                resolved_path.display()
            ));
        }

        if !resolved_path.is_file() {
            return Err(format!(
                "Path is not a file: {}",
                resolved_path.display()
            ));
        }

        Ok(())
    }
}
