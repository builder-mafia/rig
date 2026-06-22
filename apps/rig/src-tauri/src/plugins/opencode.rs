use std::{fs, path::Path};

use serde_json::{json, Value};

use crate::skills::fs::expand_path;

use super::models::{PluginInstallError, PluginInstallErrorCode, PluginTarget};

pub const TARGET_ID: &str = "opencode";

const CONFIG_DIR: &str = "~/.config/opencode";
const JSON_CONFIG_PATH: &str = "~/.config/opencode/opencode.json";
const JSONC_CONFIG_PATH: &str = "~/.config/opencode/opencode.jsonc";
const PLUGIN_NAME: &str = "rig-opencode";

pub async fn target() -> PluginTarget {
    let is_installed = is_installed();

    PluginTarget {
        id: TARGET_ID.to_string(),
        name: "OpenCode".to_string(),
        is_installed,
    }
}

pub async fn install() -> Result<PluginTarget, PluginInstallError> {
    install_config(
        &expand_path(CONFIG_DIR),
        &expand_path(JSON_CONFIG_PATH),
        &expand_path(JSONC_CONFIG_PATH),
    )?;
    Ok(target().await)
}

fn is_installed() -> bool {
    let json_path = expand_path(JSON_CONFIG_PATH);
    let jsonc_path = expand_path(JSONC_CONFIG_PATH);

    is_installed_from_paths(&json_path, &jsonc_path)
}

fn is_installed_from_paths(json_path: &Path, jsonc_path: &Path) -> bool {
    is_installed_from_json_path(json_path) || is_installed_from_jsonc_path(jsonc_path)
}

fn is_installed_from_json_path(path: &Path) -> bool {
    let Ok(content) = fs::read_to_string(path) else {
        return false;
    };

    let Ok(config) = serde_json::from_str::<Value>(&content) else {
        return false;
    };

    config_has_plugin(&config)
}

fn is_installed_from_jsonc_path(path: &Path) -> bool {
    let Ok(content) = fs::read_to_string(path) else {
        return false;
    };

    // Rig does not edit JSONC yet, but it can still detect an existing setup.
    content.contains(format!("\"{PLUGIN_NAME}\"").as_str())
}

fn config_has_plugin(config: &Value) -> bool {
    config
        .get("plugin")
        .and_then(Value::as_array)
        .map(|plugins| {
            plugins
                .iter()
                .any(|plugin| plugin.as_str() == Some(PLUGIN_NAME))
        })
        .unwrap_or(false)
}

fn install_config(
    config_dir: &Path,
    json_path: &Path,
    jsonc_path: &Path,
) -> Result<(), PluginInstallError> {
    if is_installed_from_paths(json_path, jsonc_path) {
        return Ok(());
    }

    if jsonc_path.exists() && !json_path.exists() {
        return Err(PluginInstallError::new(
            PluginInstallErrorCode::ConfigJsoncUnsupported,
            "OpenCode uses opencode.jsonc, which Rig cannot edit automatically.",
            Some(format!(
                "Rig found `{}`. Add `rig-opencode` to the `plugin` array manually, or convert the config to `opencode.json`.",
                jsonc_path.display()
            )),
        ));
    }

    fs::create_dir_all(config_dir).map_err(|error| {
        PluginInstallError::new(
            PluginInstallErrorCode::ConfigWriteFailed,
            "Failed to create OpenCode config directory.",
            Some(error.to_string()),
        )
    })?;

    let mut config = if json_path.exists() {
        read_json_config(json_path)?
    } else {
        json!({
            "$schema": "https://opencode.ai/config.json",
        })
    };

    add_plugin_to_config(&mut config)?;
    write_json_config(json_path, &config)
}

fn read_json_config(path: &Path) -> Result<Value, PluginInstallError> {
    let content = fs::read_to_string(path).map_err(|error| {
        PluginInstallError::new(
            PluginInstallErrorCode::ConfigParseFailed,
            "Failed to read OpenCode config.",
            Some(error.to_string()),
        )
    })?;

    serde_json::from_str(&content).map_err(|error| {
        PluginInstallError::new(
            PluginInstallErrorCode::ConfigParseFailed,
            "Failed to parse OpenCode config as JSON.",
            Some(error.to_string()),
        )
    })
}

fn write_json_config(path: &Path, config: &Value) -> Result<(), PluginInstallError> {
    let content = serde_json::to_string_pretty(config).map_err(|error| {
        PluginInstallError::new(
            PluginInstallErrorCode::ConfigWriteFailed,
            "Failed to serialize OpenCode config.",
            Some(error.to_string()),
        )
    })?;

    fs::write(path, format!("{content}\n")).map_err(|error| {
        PluginInstallError::new(
            PluginInstallErrorCode::ConfigWriteFailed,
            "Failed to write OpenCode config.",
            Some(error.to_string()),
        )
    })
}

fn add_plugin_to_config(config: &mut Value) -> Result<(), PluginInstallError> {
    let Some(config_object) = config.as_object_mut() else {
        return Err(PluginInstallError::new(
            PluginInstallErrorCode::InvalidConfigShape,
            "OpenCode config must be a JSON object.",
            None,
        ));
    };

    match config_object.get_mut("plugin") {
        Some(Value::Array(plugins)) => {
            if !plugins
                .iter()
                .any(|plugin| plugin.as_str() == Some(PLUGIN_NAME))
            {
                plugins.push(Value::String(PLUGIN_NAME.to_string()));
            }
        }
        Some(_) => {
            return Err(PluginInstallError::new(
                PluginInstallErrorCode::InvalidConfigShape,
                "OpenCode config `plugin` field must be an array.",
                None,
            ));
        }
        None => {
            config_object.insert(
                "plugin".to_string(),
                Value::Array(vec![Value::String(PLUGIN_NAME.to_string())]),
            );
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use std::path::PathBuf;

    use super::*;

    fn temp_config_paths() -> (PathBuf, PathBuf, PathBuf) {
        let root = std::env::temp_dir().join(format!("rig-opencode-test-{}", uuid::Uuid::new_v4()));
        let config_dir = root.join("opencode");
        let json_path = config_dir.join("opencode.json");
        let jsonc_path = config_dir.join("opencode.jsonc");

        (config_dir, json_path, jsonc_path)
    }

    fn read_config(path: &Path) -> Value {
        serde_json::from_str(&fs::read_to_string(path).unwrap()).unwrap()
    }

    #[test]
    fn creates_json_config_when_missing() {
        let (config_dir, json_path, jsonc_path) = temp_config_paths();

        install_config(&config_dir, &json_path, &jsonc_path).unwrap();

        let config = read_config(&json_path);
        assert_eq!(config["plugin"], json!([PLUGIN_NAME]));
        assert_eq!(config["$schema"], json!("https://opencode.ai/config.json"));

        let _ = fs::remove_dir_all(config_dir.parent().unwrap());
    }

    #[test]
    fn adds_plugin_to_existing_array() {
        let (config_dir, json_path, jsonc_path) = temp_config_paths();
        fs::create_dir_all(&config_dir).unwrap();
        fs::write(&json_path, r#"{"plugin":["other-plugin"]}"#).unwrap();

        install_config(&config_dir, &json_path, &jsonc_path).unwrap();

        let config = read_config(&json_path);
        assert_eq!(config["plugin"], json!(["other-plugin", PLUGIN_NAME]));

        let _ = fs::remove_dir_all(config_dir.parent().unwrap());
    }

    #[test]
    fn does_not_duplicate_existing_plugin() {
        let (config_dir, json_path, jsonc_path) = temp_config_paths();
        fs::create_dir_all(&config_dir).unwrap();
        fs::write(&json_path, format!(r#"{{"plugin":["{PLUGIN_NAME}"]}}"#)).unwrap();

        install_config(&config_dir, &json_path, &jsonc_path).unwrap();

        let config = read_config(&json_path);
        assert_eq!(config["plugin"], json!([PLUGIN_NAME]));

        let _ = fs::remove_dir_all(config_dir.parent().unwrap());
    }

    #[test]
    fn errors_when_plugin_field_is_not_array() {
        let (config_dir, json_path, jsonc_path) = temp_config_paths();
        fs::create_dir_all(&config_dir).unwrap();
        fs::write(&json_path, r#"{"plugin":"rig-opencode"}"#).unwrap();

        let error = install_config(&config_dir, &json_path, &jsonc_path).unwrap_err();

        assert!(matches!(
            error.code,
            PluginInstallErrorCode::InvalidConfigShape
        ));

        let _ = fs::remove_dir_all(config_dir.parent().unwrap());
    }

    #[test]
    fn errors_when_only_jsonc_config_exists() {
        let (config_dir, json_path, jsonc_path) = temp_config_paths();
        fs::create_dir_all(&config_dir).unwrap();
        fs::write(&jsonc_path, "{} // jsonc").unwrap();

        let error = install_config(&config_dir, &json_path, &jsonc_path).unwrap_err();

        assert!(matches!(
            error.code,
            PluginInstallErrorCode::ConfigJsoncUnsupported
        ));
        assert!(error.message.contains("opencode.jsonc"));
        assert!(!json_path.exists());

        let _ = fs::remove_dir_all(config_dir.parent().unwrap());
    }

    #[test]
    fn detects_installed_plugin_from_jsonc_config() {
        let (config_dir, json_path, jsonc_path) = temp_config_paths();
        fs::create_dir_all(&config_dir).unwrap();
        fs::write(&jsonc_path, r#"{"plugin":["rig-opencode"]} // jsonc"#).unwrap();

        assert!(is_installed_from_paths(&json_path, &jsonc_path));

        install_config(&config_dir, &json_path, &jsonc_path).unwrap();
        assert!(!json_path.exists());

        let _ = fs::remove_dir_all(config_dir.parent().unwrap());
    }

    #[test]
    fn uses_json_config_when_json_and_jsonc_both_exist() {
        let (config_dir, json_path, jsonc_path) = temp_config_paths();
        fs::create_dir_all(&config_dir).unwrap();
        fs::write(&json_path, r#"{"plugin":["other-plugin"]}"#).unwrap();
        fs::write(&jsonc_path, "{} // jsonc").unwrap();

        install_config(&config_dir, &json_path, &jsonc_path).unwrap();

        let config = read_config(&json_path);
        assert_eq!(config["plugin"], json!(["other-plugin", PLUGIN_NAME]));

        let _ = fs::remove_dir_all(config_dir.parent().unwrap());
    }
}
