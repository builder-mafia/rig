use aisdk::{core::Tool, macros::tool};
use std::process::Command;

#[tool(
    name = "bash",
    desc = "Execute bash commands on the local machine.\n\nCommands run from the app process working directory unless the command changes directory itself. Use absolute paths when the target location matters.\n\nDangerous destructive commands are blocked, including rm -rf, chmod -R, chown -R, mkfs, dd, shutdown, reboot, and fork bombs.\n\nCommon operations:\n  ls -la              # List files with details\n  find . -name '*.ts' # Find files by pattern\n  grep -r 'pattern' . # Search file contents\n  cat <file>          # View file contents\n\nThe tool returns a JSON string with success, exitCode, stdout, and stderr."
)]
pub fn bash(command: String) -> Tool {
    let normalized = command.to_lowercase();
    let compact = normalized.split_whitespace().collect::<Vec<_>>().join(" ");
    let blocked_patterns = [
        "rm -rf",
        "rm -fr",
        "rm -r -f",
        "rm -f -r",
        "sudo rm",
        "chmod -r",
        "chown -r",
        "mkfs",
        "dd if=",
        ":(){",
        "shutdown",
        "reboot",
        "halt",
        "diskutil erase",
    ];

    if blocked_patterns
        .iter()
        .any(|pattern| compact.contains(pattern))
    {
        return Err("Blocked dangerous bash command.".to_string());
    }

    let output = Command::new("sh")
        .arg("-c")
        .arg(&command)
        .output()
        .map_err(|e| format!("Failed to execute command {}: {}", command, e))?;

    serde_json::to_string(&serde_json::json!({
        "success": output.status.success(),
        "exitCode": output.status.code(),
        "stdout": String::from_utf8_lossy(&output.stdout),
        "stderr": String::from_utf8_lossy(&output.stderr),
    }))
    .map_err(|e| format!("Failed to serialize bash output: {}", e))
}
