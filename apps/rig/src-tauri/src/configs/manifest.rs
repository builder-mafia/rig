use super::{
    files::{normal_relative, read_bounded, revision, summarize},
    models::*,
};
use base64::{engine::general_purpose::STANDARD, Engine};
use serde::Serialize;
use std::path::Path;

fn valid_id(value: &str) -> bool {
    !value.is_empty()
        && value.len() <= 80
        && value
            .bytes()
            .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-' || b == b'.')
}

fn valid_icon(icon: &str) -> bool {
    if [
        "codex",
        "browser",
        "terminal",
        "settings",
        "claude-code",
        "starship",
        "gemini-cli",
    ]
    .contains(&icon)
    {
        return true;
    }
    let Some(encoded) = icon.strip_prefix("data:image/png;base64,") else {
        return false;
    };
    if encoded.len() > 180_000 {
        return false;
    }
    let Ok(bytes) = STANDARD.decode(encoded) else {
        return false;
    };
    if bytes.len() < 24 || !bytes.starts_with(b"\x89PNG\r\n\x1a\n") {
        return false;
    }
    let width = u32::from_be_bytes(bytes[16..20].try_into().unwrap());
    let height = u32::from_be_bytes(bytes[20..24].try_into().unwrap());
    (1..=512).contains(&width) && (1..=512).contains(&height)
}

fn valid_schema(schema: &serde_json::Value) -> bool {
    if schema.is_boolean() {
        return true;
    }
    let Some(map) = schema.as_object() else {
        return false;
    };
    for key in ["title", "description", "$ref"] {
        if map.get(key).is_some_and(|value| !value.is_string()) {
            return false;
        }
    }
    if map
        .get("$ref")
        .and_then(|value| value.as_str())
        .is_some_and(|value| value != "#" && !value.starts_with("#/"))
    {
        return false;
    }
    if map.get("type").is_some_and(|value| {
        !value.is_string()
            && !value
                .as_array()
                .is_some_and(|items| items.iter().all(|item| item.is_string()))
    }) {
        return false;
    }
    if map.get("enum").is_some_and(|value| !value.is_array()) {
        return false;
    }
    if map
        .get("writeOnly")
        .is_some_and(|value| !value.is_boolean())
    {
        return false;
    }
    if map.get("required").is_some_and(|value| {
        !value
            .as_array()
            .is_some_and(|items| items.iter().all(|item| item.is_string()))
    }) {
        return false;
    }
    for key in ["properties", "definitions", "$defs"] {
        if map.get(key).is_some_and(|value| {
            !value
                .as_object()
                .is_some_and(|properties| properties.values().all(valid_schema))
        }) {
            return false;
        }
    }
    for key in ["items", "additionalProperties"] {
        if map.get(key).is_some_and(|value| !valid_schema(value)) {
            return false;
        }
    }
    for key in ["allOf", "anyOf", "oneOf"] {
        if map.get(key).is_some_and(|value| {
            !value
                .as_array()
                .is_some_and(|items| items.iter().all(valid_schema))
        }) {
            return false;
        }
    }
    true
}

pub fn validate(plugin: &ConfigPlugin) -> Result<(), ConfigError> {
    let invalid = || error("invalidManifest", "Invalid configuration plugin manifest.");
    if plugin.schema_version != 1
        || !valid_id(&plugin.id)
        || plugin.name.trim().is_empty()
        || plugin.name.len() > 100
        || plugin.version.is_empty()
        || plugin.version.len() > 80
        || plugin.description.len() > 2000
        || !valid_icon(&plugin.icon)
        || plugin.files.is_empty()
        || plugin.files.len() > 20
    {
        return Err(invalid());
    }
    if let Some(homepage) = &plugin.homepage {
        let url = url::Url::parse(homepage).map_err(|_| invalid())?;
        if url.scheme() != "https" || url.host_str().is_none() {
            return Err(invalid());
        }
    }
    let mut ids = std::collections::HashSet::new();
    for file in &plugin.files {
        if !valid_id(&file.id)
            || !ids.insert(&file.id)
            || file.label.is_empty()
            || file.label.len() > 100
            || !file.path.strip_prefix("~/").is_some_and(normal_relative)
        {
            return Err(invalid());
        }
        if let Some(environment) = &file.environment {
            if environment.name.is_empty()
                || environment.name.len() > 100
                || !environment
                    .name
                    .bytes()
                    .all(|b| b.is_ascii_uppercase() || b.is_ascii_digit() || b == b'_')
                || environment
                    .append
                    .as_deref()
                    .is_some_and(|value| !normal_relative(value))
            {
                return Err(invalid());
            }
        }
        if let Some(schema) = &file.schema {
            if !schema.is_object()
                || !valid_schema(schema)
                || matches!(file.format, ConfigFormat::Text)
            {
                return Err(invalid());
            }
        }
    }
    Ok(())
}

pub fn summary(
    plugin: &ConfigPlugin,
    installed: bool,
    builtin: bool,
    home: &Path,
) -> PluginSummary {
    PluginSummary {
        id: plugin.id.clone(),
        name: plugin.name.clone(),
        version: plugin.version.clone(),
        description: plugin.description.clone(),
        icon: plugin.icon.clone(),
        homepage: plugin.homepage.clone(),
        installed,
        builtin,
        files: plugin
            .files
            .iter()
            .map(|file| summarize(file, home))
            .collect(),
    }
}

pub fn load(path: &Path) -> Result<(ConfigPlugin, String), ConfigError> {
    let content = read_bounded(path, 1_048_576)?;
    let plugin = serde_json::from_str(&content)
        .map_err(|_| error("invalidManifest", "Could not parse this plugin manifest."))?;
    validate(&plugin)?;
    Ok((plugin, revision(&content)))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginPreview {
    pub plugin: PluginSummary,
    pub revision: String,
}
