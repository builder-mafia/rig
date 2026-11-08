use super::{catalog::builtins, files::read_bounded, manifest, models::*};
use serde::{Deserialize, Serialize};
use std::{fs, io::Write, path::Path, sync::Mutex};

static REGISTRY_LOCK: Mutex<()> = Mutex::new(());
const REGISTRY_FILE: &str = "config-plugins-v1.json";
const MAX_REGISTRY_BYTES: u64 = 8 * 1_048_576;

#[derive(Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Registry {
    pub installed: Vec<String>,
    pub custom: Vec<ConfigPlugin>,
}

pub fn load(directory: &Path) -> Result<Registry, ConfigError> {
    let path = directory.join(REGISTRY_FILE);
    if !path.exists() {
        return Ok(Registry::default());
    }
    let registry: Registry = serde_json::from_str(&read_bounded(&path, MAX_REGISTRY_BYTES)?)
        .map_err(|_| {
            error(
                "registryFailed",
                "Could not read installed configuration plugins.",
            )
        })?;
    for plugin in &registry.custom {
        manifest::validate(plugin)?;
    }
    Ok(registry)
}

pub fn list(directory: &Path, home: &Path) -> Result<Vec<PluginSummary>, ConfigError> {
    let registry = load(directory)?;
    Ok(builtins()
        .iter()
        // A manifest imported before an ID became built in keeps its file paths.
        .filter(|plugin| !registry.custom.iter().any(|custom| custom.id == plugin.id))
        .map(|plugin| {
            manifest::summary(plugin, registry.installed.contains(&plugin.id), true, home)
        })
        .chain(registry.custom.iter().map(|plugin| {
            manifest::summary(plugin, registry.installed.contains(&plugin.id), false, home)
        }))
        .collect())
}

pub fn find_installed(directory: &Path, id: &str) -> Result<ConfigPlugin, ConfigError> {
    let registry = load(directory)?;
    if !registry.installed.iter().any(|installed| installed == id) {
        return Err(error(
            "notInstalled",
            "Install this configuration plugin first.",
        ));
    }
    registry
        .custom
        .iter()
        .chain(builtins())
        .find(|plugin| plugin.id == id)
        .cloned()
        .ok_or_else(|| error("notFound", "Configuration plugin not found."))
}

fn update(
    directory: &Path,
    change: impl FnOnce(&mut Registry) -> Result<(), ConfigError>,
) -> Result<(), ConfigError> {
    let _guard = REGISTRY_LOCK
        .lock()
        .map_err(|_| error("registryFailed", "Plugin registry is unavailable."))?;
    let mut registry = load(directory)?;
    change(&mut registry)?;
    let bytes = serde_json::to_vec_pretty(&registry)
        .map_err(|_| error("registryFailed", "Could not encode configuration plugins."))?;
    if bytes.len() as u64 > MAX_REGISTRY_BYTES {
        return Err(error("tooLarge", "Configuration plugin storage is full."));
    }
    fs::create_dir_all(directory)
        .map_err(|_| error("registryFailed", "Could not create plugin storage."))?;
    let temporary = directory.join(format!(".config-plugins-{}.tmp", uuid::Uuid::new_v4()));
    let result = (|| {
        let mut options = fs::OpenOptions::new();
        options.write(true).create_new(true);
        #[cfg(unix)]
        {
            use std::os::unix::fs::OpenOptionsExt;
            options.mode(0o600);
        }
        let mut file = options.open(&temporary)?;
        file.write_all(&bytes)?;
        file.sync_all()?;
        fs::rename(&temporary, directory.join(REGISTRY_FILE))
    })();
    if result.is_err() {
        let _ = fs::remove_file(&temporary);
    }
    result.map_err(|_| error("registryFailed", "Could not save configuration plugins."))
}

pub fn install(directory: &Path, id: &str) -> Result<(), ConfigError> {
    if !builtins().iter().any(|plugin| plugin.id == id) {
        return Err(error("notFound", "Unknown configuration plugin."));
    }
    update(directory, |registry| {
        if !registry.installed.iter().any(|installed| installed == id) {
            registry.installed.push(id.into());
        }
        Ok(())
    })
}

pub fn import(
    directory: &Path,
    path: &Path,
    expected_revision: &str,
) -> Result<String, ConfigError> {
    let (plugin, revision) = manifest::load(path)?;
    if revision != expected_revision {
        return Err(error(
            "conflict",
            "The plugin manifest changed. Preview it again.",
        ));
    }
    let id = plugin.id.clone();
    update(directory, |registry| {
        if builtins()
            .iter()
            .chain(registry.custom.iter())
            .any(|existing| existing.id == plugin.id)
        {
            return Err(error(
                "alreadyInstalled",
                "A plugin with this ID already exists.",
            ));
        }
        registry.installed.push(plugin.id.clone());
        registry.custom.push(plugin);
        Ok(())
    })?;
    Ok(id)
}

pub fn remove(directory: &Path, id: &str) -> Result<(), ConfigError> {
    update(directory, |registry| {
        registry.installed.retain(|installed| installed != id);
        registry.custom.retain(|plugin| plugin.id != id);
        Ok(())
    })
}
