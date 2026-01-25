use super::{entities, Storage};

impl Storage {
    pub async fn get_app_settings(&self) -> Result<entities::AppSettings, String> {
        match self.read(&["settings"]).await {
            Ok(settings) => Ok(settings),
            Err(_) => Ok(entities::AppSettings::default()),
        }
    }

    pub async fn save_app_settings(&self, settings: &entities::AppSettings) -> Result<(), String> {
        self.write(&["settings"], settings).await
    }
}
