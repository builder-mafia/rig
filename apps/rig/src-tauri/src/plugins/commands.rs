use super::models::{PluginInstallError, PluginInstallErrorCode, PluginTarget};
use super::{claude_code, opencode};

#[tauri::command]
pub async fn list_plugin_targets() -> Vec<PluginTarget> {
    let (claude_code_target, opencode_target) =
        tokio::join!(claude_code::target(), opencode::target());

    vec![claude_code_target, opencode_target]
}

#[tauri::command]
pub async fn install_plugin_target(target_id: String) -> Result<PluginTarget, PluginInstallError> {
    match target_id.as_str() {
        claude_code::TARGET_ID => claude_code::install().await,
        opencode::TARGET_ID => opencode::install().await,
        _ => Err(PluginInstallError::new(
            PluginInstallErrorCode::UnsupportedTarget,
            format!("Unsupported plugin target: {target_id}"),
            None,
        )),
    }
}
