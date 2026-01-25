use super::{entities, Storage};

impl Storage {
    pub async fn get_messages(&self, channel_id: &str) -> Result<Vec<entities::Message>, String> {
        match self
            .read::<entities::MessagesFile>(&["channel", channel_id, "messages"])
            .await
        {
            Ok(file) => Ok(file.messages),
            Err(_) => Ok(Vec::new()),
        }
    }

    pub async fn save_messages(
        &self,
        channel_id: &str,
        messages: &[entities::Message],
    ) -> Result<(), String> {
        let file = entities::MessagesFile {
            messages: messages.to_vec(),
        };
        self.write(&["channel", channel_id, "messages"], &file)
            .await
    }
}
