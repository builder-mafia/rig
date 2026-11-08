use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct EnvironmentPath {
    pub name: String,
    pub append: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ConfigFormat {
    Json,
    Toml,
    Text,
}

#[derive(Debug, Deserialize)]
#[serde(untagged)]
pub enum PropertyPart {
    Key(String),
    Index(usize),
}

#[derive(Debug, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum ConfigEdit {
    Source {
        content: String,
    },
    Property {
        path: Vec<PropertyPart>,
        value: String,
    },
    RemoveProperty {
        path: Vec<PropertyPart>,
    },
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ConfigFile {
    pub id: String,
    pub label: String,
    pub path: String,
    pub environment: Option<EnvironmentPath>,
    pub format: ConfigFormat,
    pub schema: Option<Value>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ConfigPlugin {
    pub schema_version: u32,
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub icon: String,
    pub homepage: Option<String>,
    pub files: Vec<ConfigFile>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileSummary {
    pub id: String,
    pub label: String,
    pub path: String,
    pub format: ConfigFormat,
    pub exists: bool,
    pub has_schema: bool,
    pub error: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginSummary {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub icon: String,
    pub homepage: Option<String>,
    pub installed: bool,
    pub builtin: bool,
    pub files: Vec<FileSummary>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfigDocument {
    pub path: String,
    pub format: ConfigFormat,
    pub exists: bool,
    pub content: Option<String>,
    pub value: Option<Value>,
    pub schema: Option<Value>,
    pub parse_error: Option<String>,
    pub revision: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfigError {
    pub code: &'static str,
    pub message: String,
}

pub fn error(code: &'static str, message: impl ToString) -> ConfigError {
    ConfigError {
        code,
        message: message.to_string(),
    }
}
