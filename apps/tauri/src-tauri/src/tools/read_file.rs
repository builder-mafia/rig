use aisdk::{core::Tool, macros::tool};

#[tool(name = "read_file", desc = "Read the contents of a local file.")]
pub fn read_file(path: String) -> Tool {
    std::fs::read_to_string(&path).map_err(|e| format!("Failed to read file {}: {}", path, e))
}
