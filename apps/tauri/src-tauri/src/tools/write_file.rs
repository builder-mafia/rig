use aisdk::{core::Tool, macros::tool};

#[tool(name = "write_file", desc = "Write contents to a local file.")]
pub fn write_file(path: String, content: String) -> Tool {
    std::fs::write(&path, content).map_err(|e| format!("Failed to write file {}: {}", path, e))?;
    Ok(format!("Wrote file {}", path))
}
