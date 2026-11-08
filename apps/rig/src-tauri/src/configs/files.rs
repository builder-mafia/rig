use super::models::*;
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::{
    fs::File,
    io::Read,
    path::{Component, Path, PathBuf},
};

pub const MAX_DOCUMENT_BYTES: u64 = 1_048_576;

pub fn normal_relative(path: &str) -> bool {
    !path.is_empty()
        && Path::new(path)
            .components()
            .all(|part| matches!(part, Component::Normal(_)))
}

pub fn resolve_path(
    file: &ConfigFile,
    home: &Path,
    environment: impl Fn(&str) -> Option<String>,
) -> Result<(PathBuf, PathBuf), ConfigError> {
    let relative = file
        .path
        .strip_prefix("~/")
        .filter(|p| normal_relative(p))
        .ok_or_else(|| {
            error(
                "invalidPath",
                "Plugin paths must be relative to the home directory.",
            )
        })?;
    if let Some(override_path) = &file.environment {
        if let Some(value) = environment(&override_path.name).filter(|value| !value.is_empty()) {
            let base = if let Some(relative) = value.strip_prefix("~/") {
                home.join(relative)
            } else {
                PathBuf::from(value)
            };
            if !base.is_absolute() {
                return Err(error(
                    "invalidPath",
                    "The configured environment path must be absolute.",
                ));
            }
            return if let Some(append) = &override_path.append {
                if !normal_relative(append) {
                    return Err(error("invalidPath", "Invalid environment path suffix."));
                }
                Ok((base.join(append), base))
            } else {
                let allowed = base
                    .parent()
                    .ok_or_else(|| error("invalidPath", "Invalid configuration path."))?
                    .to_path_buf();
                Ok((base, allowed))
            };
        }
    }
    Ok((home.join(relative), home.to_path_buf()))
}

pub fn read_bounded(path: &Path, limit: u64) -> Result<String, ConfigError> {
    let metadata =
        std::fs::metadata(path).map_err(|_| error("readFailed", "Could not inspect this file."))?;
    if !metadata.is_file() {
        return Err(error("invalidPath", "Choose a regular file."));
    }
    let file = File::open(path).map_err(|_| error("readFailed", "Could not open this file."))?;
    let metadata = file
        .metadata()
        .map_err(|_| error("readFailed", "Could not inspect this file."))?;
    if !metadata.is_file() {
        return Err(error("invalidPath", "Choose a regular file."));
    }
    if metadata.len() > limit {
        return Err(error("tooLarge", "This file exceeds the supported size."));
    }
    let mut content = String::new();
    file.take(limit + 1)
        .read_to_string(&mut content)
        .map_err(|_| error("readFailed", "Could not read this UTF-8 text file."))?;
    if content.len() as u64 > limit {
        return Err(error("tooLarge", "This file exceeds the supported size."));
    }
    Ok(content)
}

pub fn revision(content: &str) -> String {
    format!("{:x}", Sha256::digest(content.as_bytes()))
}

pub fn summarize(file: &ConfigFile, home: &Path) -> FileSummary {
    let resolved = resolve_path(file, home, |name| std::env::var(name).ok());
    let (path, exists, failure) = match resolved {
        Ok((path, _)) => (path.to_string_lossy().to_string(), path.is_file(), None),
        Err(cause) => (file.path.clone(), false, Some(cause.message)),
    };
    FileSummary {
        id: file.id.clone(),
        label: file.label.clone(),
        path,
        format: file.format.clone(),
        exists,
        has_schema: file.schema.is_some(),
        error: failure,
    }
}

pub(super) fn document(file: &ConfigFile, path: &Path, content: Option<String>) -> ConfigDocument {
    let mut document = ConfigDocument {
        path: path.to_string_lossy().to_string(),
        format: file.format.clone(),
        exists: false,
        content: None,
        value: None,
        schema: file.schema.clone(),
        parse_error: None,
        revision: None,
    };
    let Some(content) = content else {
        return document;
    };
    let parsed = match file.format {
        ConfigFormat::Json => serde_json::from_str(&content).map_err(|cause| {
            format!(
                "Invalid JSON at line {}, column {}.",
                cause.line(),
                cause.column()
            )
        }),
        ConfigFormat::Toml => toml::from_str::<toml::Value>(&content)
            .map(toml_to_json)
            .map_err(|cause| {
                let line = cause.span().map_or(1, |span| {
                    content
                        .as_bytes()
                        .iter()
                        .take(span.start)
                        .filter(|&&byte| byte == b'\n')
                        .count()
                        + 1
                });
                format!("Invalid TOML at line {line}.")
            }),
        ConfigFormat::Text => Ok(Value::Null),
    };
    match parsed {
        Ok(value) => document.value = Some(value),
        Err(cause) => document.parse_error = Some(cause),
    }
    document.revision = Some(revision(&content));
    document.exists = true;
    document.content = Some(content);
    document
}

fn toml_to_json(value: toml::Value) -> Value {
    match value {
        toml::Value::Datetime(value) => Value::String(value.to_string()),
        toml::Value::Array(values) => Value::Array(values.into_iter().map(toml_to_json).collect()),
        toml::Value::Table(table) => Value::Object(
            table
                .into_iter()
                .map(|(key, value)| (key, toml_to_json(value)))
                .collect(),
        ),
        value => serde_json::to_value(value).unwrap_or(Value::Null),
    }
}

pub(super) fn checked_path(
    path: &Path,
    home: &Path,
    allowed: &Path,
) -> Result<Option<PathBuf>, ConfigError> {
    let canonical = match path.canonicalize() {
        Ok(path) => path,
        Err(cause) if cause.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(_) => {
            return Err(error(
                "readFailed",
                "Could not resolve this configuration file.",
            ))
        }
    };
    if !within_roots(&canonical, home, allowed) {
        return Err(error(
            "invalidPath",
            "This file points outside its declared configuration directory.",
        ));
    }
    Ok(Some(canonical))
}

pub(super) fn within_roots(canonical: &Path, home: &Path, allowed: &Path) -> bool {
    [home, allowed].iter().any(|base| {
        base.canonicalize()
            .is_ok_and(|base| canonical.starts_with(base))
    })
}

pub fn read_document(file: &ConfigFile, home: &Path) -> Result<ConfigDocument, ConfigError> {
    let (path, allowed) = resolve_path(file, home, |name| std::env::var(name).ok())?;
    let content = checked_path(&path, home, &allowed)?
        .map(|canonical| read_bounded(&canonical, MAX_DOCUMENT_BYTES))
        .transpose()?;
    Ok(document(file, &path, content))
}
