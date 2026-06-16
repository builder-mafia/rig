use std::time::Duration;

use tokio::{process::Command, time::timeout};

use super::models::{PluginInstallError, PluginInstallErrorCode};

const COMMAND_TIMEOUT: Duration = Duration::from_secs(30);

#[derive(Debug)]
pub struct ShellOutput {
    pub code: Option<i32>,
    pub stdout: String,
    pub stderr: String,
}

impl ShellOutput {
    pub fn is_success(&self) -> bool {
        self.code == Some(0)
    }

    pub fn combined_output(&self) -> String {
        [self.stdout.trim(), self.stderr.trim()]
            .into_iter()
            .filter(|value| !value.is_empty())
            .collect::<Vec<_>>()
            .join("\n")
    }
}

pub async fn run_shell(command: &str) -> Result<ShellOutput, PluginInstallError> {
    let output = timeout(
        COMMAND_TIMEOUT,
        Command::new("zsh").arg("-lc").arg(command).output(),
    )
    .await
    .map_err(|_| {
        PluginInstallError::new(
            PluginInstallErrorCode::CommandTimedOut,
            format!("Command timed out: {command}"),
            None,
        )
    })?
    .map_err(|error| {
        PluginInstallError::new(
            PluginInstallErrorCode::CommandFailed,
            format!("Failed to run command: {command}"),
            Some(error.to_string()),
        )
    })?;

    Ok(ShellOutput {
        code: output.status.code(),
        stdout: String::from_utf8_lossy(&output.stdout).to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
    })
}

pub async fn command_exists(command: &str) -> bool {
    run_shell(format!("command -v {command}").as_str())
        .await
        .map(|output| output.is_success())
        .unwrap_or(false)
}
