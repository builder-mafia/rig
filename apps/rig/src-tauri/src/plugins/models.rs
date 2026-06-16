#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginTarget {
    pub id: String,
    pub name: String,
    pub is_installed: bool,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum PluginInstallErrorCode {
    ToolNotFound,
    CommandFailed,
    CommandTimedOut,
    ConfigJsoncUnsupported,
    ConfigParseFailed,
    ConfigWriteFailed,
    InvalidConfigShape,
    VerificationFailed,
    UnsupportedTarget,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginInstallError {
    pub code: PluginInstallErrorCode,
    pub message: String,
    pub details: Option<String>,
}

impl PluginInstallError {
    pub fn new(
        code: PluginInstallErrorCode,
        message: impl Into<String>,
        details: Option<String>,
    ) -> Self {
        Self {
            code,
            message: message.into(),
            details,
        }
    }
}
