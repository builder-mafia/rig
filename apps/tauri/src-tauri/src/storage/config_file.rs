use super::{entities, external_file::resolve_local_path, Storage};

impl Storage {
    pub async fn get_config_files(&self) -> Result<Vec<entities::ConfigFile>, String> {
        match self
            .read::<entities::ConfigFilesFile>(&["config_file"])
            .await
        {
            Ok(file) => {
                let mut config_files = file.config_files;
                config_files.sort_by(|a, b| a.order.total_cmp(&b.order));
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

    pub async fn create_config_file(
        &self,
        config_file: &entities::ConfigFile,
    ) -> Result<(), String> {
        self.validate_existing_config_file_path(&config_file.path, config_file.is_directory)?;
        self.validate_group_id(config_file.group_id.as_deref())
            .await?;

        let mut config_files = self.get_config_files().await?;

        if config_files.iter().any(|item| item.id == config_file.id) {
            return Err(format!("Config file already exists: {}", config_file.id));
        }

        config_files.push(config_file.clone());
        self.save_config_files(&config_files).await
    }

    pub async fn update_config_file(
        &self,
        config_file: &entities::ConfigFile,
    ) -> Result<(), String> {
        self.validate_existing_config_file_path(&config_file.path, config_file.is_directory)?;
        self.validate_group_id(config_file.group_id.as_deref())
            .await?;

        let mut config_files = self.get_config_files().await?;

        if let Some(existing) = config_files
            .iter_mut()
            .find(|item| item.id == config_file.id)
        {
            *existing = config_file.clone();
        } else {
            return Err(format!("Config file not found: {}", config_file.id));
        }

        self.save_config_files(&config_files).await
    }

    pub async fn delete_config_file(&self, id: &str) -> Result<(), String> {
        let config_files = self.get_config_files().await?;
        let filtered: Vec<_> = config_files
            .into_iter()
            .filter(|item| item.id != id)
            .collect();
        self.save_config_files(&filtered).await
    }

    pub async fn get_groups(&self) -> Result<Vec<entities::Group>, String> {
        match self.read::<entities::GroupsFile>(&["groups"]).await {
            Ok(file) => {
                let mut groups = file.groups;
                groups.sort_by(|a, b| a.order.total_cmp(&b.order));
                Ok(groups)
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

    pub async fn create_group(&self, group: &entities::Group) -> Result<entities::Group, String> {
        let mut groups = self.get_groups().await?;

        if groups.iter().any(|item| item.id == group.id) {
            return Err(format!("Group already exists: {}", group.id));
        }

        if groups.iter().any(|item| item.name == group.name) {
            return Err(format!("Group name already exists: {}", group.name));
        }

        groups.push(group.clone());
        self.save_groups(&groups).await?;

        Ok(group.clone())
    }

    pub async fn update_group(&self, group: &entities::Group) -> Result<(), String> {
        let mut groups = self.get_groups().await?;

        if groups
            .iter()
            .any(|item| item.id != group.id && item.name == group.name)
        {
            return Err(format!("Group name already exists: {}", group.name));
        }

        if let Some(existing) = groups.iter_mut().find(|item| item.id == group.id) {
            *existing = group.clone();
        } else {
            return Err(format!("Group not found: {}", group.id));
        }

        self.save_groups(&groups).await
    }

    pub async fn delete_group(&self, id: &str) -> Result<(), String> {
        if self
            .get_config_files()
            .await?
            .iter()
            .any(|config_file| config_file.group_id.as_deref() == Some(id))
        {
            return Err(format!("Group is still used by config files: {}", id));
        }

        let groups = self.get_groups().await?;
        if !groups.iter().any(|item| item.id == id) {
            return Err(format!("Group not found: {}", id));
        }

        let filtered: Vec<_> = groups.into_iter().filter(|item| item.id != id).collect();
        self.save_groups(&filtered).await
    }

    async fn save_config_files(&self, config_files: &[entities::ConfigFile]) -> Result<(), String> {
        let file = entities::ConfigFilesFile {
            config_files: config_files.to_vec(),
        };
        self.write(&["config_file"], &file).await
    }

    async fn save_groups(&self, groups: &[entities::Group]) -> Result<(), String> {
        let file = entities::GroupsFile {
            groups: groups.to_vec(),
        };
        self.write(&["groups"], &file).await
    }

    fn validate_existing_config_file_path(
        &self,
        path: &str,
        is_directory: bool,
    ) -> Result<(), String> {
        let resolved_path = resolve_local_path(path)?;

        if !resolved_path.exists() {
            return Err(format!(
                "Config entry does not exist: {}",
                resolved_path.display()
            ));
        }

        if is_directory {
            if !resolved_path.is_dir() {
                return Err(format!("Path is not a folder: {}", resolved_path.display()));
            }
        } else if !resolved_path.is_file() {
            return Err(format!("Path is not a file: {}", resolved_path.display()));
        }

        Ok(())
    }

    async fn validate_group_id(&self, group_id: Option<&str>) -> Result<(), String> {
        let Some(group_id) = group_id else {
            return Ok(());
        };

        if self
            .get_groups()
            .await?
            .iter()
            .any(|group| group.id == group_id)
        {
            return Ok(());
        }

        Err(format!("Group not found: {}", group_id))
    }
}
