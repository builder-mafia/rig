use chrono::Utc;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Channel {
    pub id: String,
    pub agent_id: Option<String>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub pin: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Message {
    pub id: String,
    pub role: String,
    pub parts: Vec<serde_json::Value>,
    pub metadata: Option<serde_json::Value>,
    pub created_at: i64,
    pub is_summary: Option<bool>,
    pub compacted_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Agent {
    pub id: String,
    pub name: String,
    pub provider_name: String,
    pub model: String,
    pub prompt: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

impl Default for Agent {
    fn default() -> Self {
        Self {
            id: "default".to_string(),
            name: "Default Agent".to_string(),
            provider_name: "openai".to_string(),
            model: "gpt-4.1-nano".to_string(),
            prompt: None,
            created_at: Utc::now().timestamp(),
            updated_at: Utc::now().timestamp(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub last_used_provider: Option<String>,
    pub last_used_model: Option<String>,
    pub updated_at: i64,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            last_used_provider: None,
            last_used_model: None,
            updated_at: Utc::now().timestamp(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessagesFile {
    pub messages: Vec<Message>,
}
