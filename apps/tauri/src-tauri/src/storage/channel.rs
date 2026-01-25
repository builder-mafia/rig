use super::{entities, Storage};

impl Storage {
    pub async fn get_all_channels(&self) -> Result<Vec<entities::Channel>, String> {
        let channel_ids = self.list_dirs(&["channel"]).await.unwrap_or_default();

        let mut channels = Vec::new();
        for id in channel_ids {
            if let Ok(info) = self
                .read::<entities::Channel>(&["channel", &id, "info"])
                .await
            {
                channels.push(info);
            }
        }

        channels.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
        Ok(channels)
    }

    pub async fn get_channel(&self, id: &str) -> Result<entities::Channel, String> {
        self.read(&["channel", id, "info"]).await
    }

    pub async fn create_channel(&self, info: &entities::Channel) -> Result<(), String> {
        self.write(&["channel", &info.id, "info"], info).await
    }

    pub async fn update_channel(&self, info: &entities::Channel) -> Result<(), String> {
        self.write(&["channel", &info.id, "info"], info).await
    }

    pub async fn delete_channel(&self, id: &str) -> Result<(), String> {
        self.remove_dir(&["channel", id]).await
    }
}
