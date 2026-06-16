use super::models::{PluginInstallError, PluginInstallErrorCode, PluginTarget};
use super::process::{command_exists, run_shell};

pub const TARGET_ID: &str = "claude-code";

const PLUGIN_ID: &str = "rig-claude-code@rig";
const MARKETPLACE_ADD_COMMAND: &str = "claude plugin marketplace add builder-mafia/rig";
const PLUGIN_INSTALL_COMMAND: &str = "claude plugin install rig-claude-code@rig";

pub async fn target() -> PluginTarget {
    let is_detected = command_exists("claude").await;
    let is_installed = if is_detected {
        is_plugin_installed().await.unwrap_or(false)
    } else {
        false
    };

    PluginTarget {
        id: TARGET_ID.to_string(),
        name: "Claude Code".to_string(),
        is_installed,
    }
}

pub async fn install() -> Result<PluginTarget, PluginInstallError> {
    if !command_exists("claude").await {
        return Err(PluginInstallError::new(
            PluginInstallErrorCode::ToolNotFound,
            "Claude Code CLI was not found.",
            Some("Install Claude Code and make sure `claude` is available in PATH.".to_string()),
        ));
    }

    let marketplace_output = run_shell(MARKETPLACE_ADD_COMMAND).await?;
    if !marketplace_output.is_success()
        && !is_already_added_output(&marketplace_output.combined_output())
    {
        return Err(PluginInstallError::new(
            PluginInstallErrorCode::CommandFailed,
            "Failed to add the Rig Claude Code marketplace.",
            Some(marketplace_output.combined_output()),
        ));
    }

    let install_output = run_shell(PLUGIN_INSTALL_COMMAND).await?;
    if !install_output.is_success()
        && !is_already_installed_output(&install_output.combined_output())
    {
        return Err(PluginInstallError::new(
            PluginInstallErrorCode::CommandFailed,
            "Failed to install the Rig Claude Code plugin.",
            Some(install_output.combined_output()),
        ));
    }

    if !is_plugin_installed().await? {
        return Err(PluginInstallError::new(
            PluginInstallErrorCode::VerificationFailed,
            "Claude Code plugin installation could not be verified.",
            Some(format!("Expected `{PLUGIN_ID}` in `claude plugin list`.")),
        ));
    }

    Ok(target().await)
}

async fn is_plugin_installed() -> Result<bool, PluginInstallError> {
    let output = run_shell("claude plugin list").await?;

    if !output.is_success() {
        return Ok(false);
    }

    Ok(output.combined_output().contains(PLUGIN_ID))
}

fn is_already_added_output(output: &str) -> bool {
    let normalized = output.to_lowercase();
    normalized.contains("already") && normalized.contains("marketplace")
}

fn is_already_installed_output(output: &str) -> bool {
    let normalized = output.to_lowercase();
    normalized.contains("already") && normalized.contains("install")
}
