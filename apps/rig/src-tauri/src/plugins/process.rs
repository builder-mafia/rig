use std::time::Duration;

use tokio::{process::Command, time::timeout};

use super::models::{PluginInstallError, PluginInstallErrorCode};

const COMMAND_TIMEOUT: Duration = Duration::from_secs(180);

const FALLBACK_PATHS: &[&str] = &[
    "~/.local/bin",
    "~/.claude/local",
    "~/.claude/local/bin",
    "~/.npm-global/bin",
    "~/.bun/bin",
    "/opt/homebrew/bin",
    "/usr/local/bin",
    "/usr/bin",
    "/bin",
    "/usr/sbin",
    "/sbin",
];

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
    let command = format!(
        "export PATH={}:$PATH; {}",
        shell_quote(&fallback_path_prefix()),
        command
    );

    let output = timeout(
        COMMAND_TIMEOUT,
        Command::new("zsh").arg("-lc").arg(&command).output(),
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

fn fallback_path_prefix() -> String {
    let home = std::env::var("HOME").unwrap_or_default();

    FALLBACK_PATHS
        .iter()
        .map(|path| {
            if let Some(rest) = path.strip_prefix("~/") {
                format!("{home}/{rest}")
            } else {
                path.to_string()
            }
        })
        .collect::<Vec<_>>()
        .join(":")
}

fn shell_quote(value: &str) -> String {
    format!("'{}'", value.replace('\'', "'\\''"))
}
