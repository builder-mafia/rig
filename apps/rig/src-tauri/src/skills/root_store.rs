use std::fs;
use std::path::PathBuf;

use sha2::{Digest, Sha256};
use tauri::{AppHandle, Manager};

use super::models::{
    ImportedSkillRoot, SkillProvider, SkillRoot, SkillRootImportError, SkillRootImportErrorCode,
    SkillRootKind, SkillScopeKind,
};

const SKILL_ROOTS_FILE_NAME: &str = "skill-roots.json";

pub fn list_imported_skill_roots(app: &AppHandle) -> Vec<SkillRoot> {
    load_imported_skill_roots(app)
        .unwrap_or_default()
        .into_iter()
        .flat_map(repository_provider_roots)
        .collect()
}

pub fn import_skill_root_from_path(
    app: &AppHandle,
    path: PathBuf,
) -> Result<SkillRoot, SkillRootImportError> {
    if !path.exists() {
        return Err(SkillRootImportError {
            code: SkillRootImportErrorCode::PathNotFound,
            message: format!("Skill root path does not exist: {}", path.display()),
        });
    }

    if !path.is_dir() {
        return Err(SkillRootImportError {
            code: SkillRootImportErrorCode::NotDirectory,
            message: format!("Skill root path is not a directory: {}", path.display()),
        });
    }

    let path = path.canonicalize().map_err(|error| SkillRootImportError {
        code: SkillRootImportErrorCode::ReadFailed,
        message: format!("Failed to resolve skill root path: {}", error),
    })?;

    let label = path
        .file_name()
        .map(|name| name.to_string_lossy().to_string())
        .unwrap_or_else(|| path.to_string_lossy().to_string());
    let path = path.to_string_lossy().to_string();

    let mut imported_roots = load_imported_skill_roots(app)?;

    if let Some(existing) = imported_roots.iter().find(|root| root.path == path) {
        return Ok(repository_provider_root(existing.clone()));
    }

    let id = unique_root_id(&label, &path, &imported_roots);

    let imported = ImportedSkillRoot { id, path, label };

    imported_roots.push(imported.clone());
    save_imported_skill_roots(app, &imported_roots)?;

    Ok(repository_provider_root(imported))
}

fn unique_root_id(label: &str, path: &str, existing: &[ImportedSkillRoot]) -> String {
    if !existing.iter().any(|root| root.id == label) {
        return label.to_string();
    }

    let digest = Sha256::digest(path.as_bytes());
    let suffix = digest[..4]
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect::<String>();

    format!("{label}-{suffix}")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn scans_the_full_project_including_nested_and_custom_skill_folders() {
        let directory = std::env::temp_dir().join(format!(
            "rig-nested-scan-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        fs::create_dir_all(&directory).unwrap();
        for relative in [
            ".agents/skills/first",
            "packages/web/.claude/skills/nested",
            "custom/group/third",
            "node_modules/ignored",
            ".git/ignored",
            ".archive/ignored",
            "target/ignored",
        ] {
            let path = directory.join(relative);
            fs::create_dir_all(&path).unwrap();
            fs::write(
                path.join("SKILL.md"),
                "---\nname: example\ndescription: Test\n---\nInstructions",
            )
            .unwrap();
        }
        let root = repository_provider_root(ImportedSkillRoot {
            id: "project".into(),
            path: directory.to_string_lossy().into_owned(),
            label: "Project".into(),
        });
        let skills = super::super::scanner::list_skills_from_root(&root).unwrap();
        assert_eq!(skills.len(), 3);
        assert!(skills.iter().all(|skill| skill.scope_id == root.path));
        assert!(skills
            .iter()
            .any(|skill| skill.relative_path == "packages/web/.claude/skills/nested"));
        assert!(skills
            .iter()
            .any(|skill| skill.relative_path == "custom/group/third"));
        fs::remove_dir_all(directory).unwrap();
    }

    #[test]
    fn keeps_readable_label_as_first_root_id() {
        assert_eq!(unique_root_id("rig", "/work/rig", &[]), "rig");
    }

    #[test]
    fn disambiguates_same_named_project_paths() {
        let existing = vec![ImportedSkillRoot {
            id: "rig".to_string(),
            path: "/work/rig".to_string(),
            label: "rig".to_string(),
        }];

        let id = unique_root_id("rig", "/archive/rig", &existing);

        assert!(id.starts_with("rig-"));
        assert_eq!(id.len(), 12);
    }
}

pub fn remove_imported_skill_root(
    app: &AppHandle,
    root_id: String,
) -> Result<(), SkillRootImportError> {
    let mut imported_roots = load_imported_skill_roots(app)?;
    let root_count = imported_roots.len();

    imported_roots.retain(|root| root.id != root_id);

    if imported_roots.len() == root_count {
        return Err(SkillRootImportError {
            code: SkillRootImportErrorCode::NotFound,
            message: format!("Imported skill root not found: {}", root_id),
        });
    }

    save_imported_skill_roots(app, &imported_roots)
}

fn load_imported_skill_roots(
    app: &AppHandle,
) -> Result<Vec<ImportedSkillRoot>, SkillRootImportError> {
    let path = skill_roots_file_path(app)?;

    if !path.exists() {
        return Ok(vec![]);
    }

    let content = fs::read_to_string(&path).map_err(|error| SkillRootImportError {
        code: SkillRootImportErrorCode::ReadFailed,
        message: format!("Failed to read imported skill roots: {}", error),
    })?;

    serde_json::from_str(&content).map_err(|error| SkillRootImportError {
        code: SkillRootImportErrorCode::ReadFailed,
        message: format!("Failed to parse imported skill roots: {}", error),
    })
}

fn save_imported_skill_roots(
    app: &AppHandle,
    roots: &[ImportedSkillRoot],
) -> Result<(), SkillRootImportError> {
    let path = skill_roots_file_path(app)?;

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| SkillRootImportError {
            code: SkillRootImportErrorCode::WriteFailed,
            message: format!("Failed to create skill roots directory: {}", error),
        })?;
    }

    let content = serde_json::to_string_pretty(roots).map_err(|error| SkillRootImportError {
        code: SkillRootImportErrorCode::WriteFailed,
        message: format!("Failed to serialize imported skill roots: {}", error),
    })?;

    fs::write(path, content).map_err(|error| SkillRootImportError {
        code: SkillRootImportErrorCode::WriteFailed,
        message: format!("Failed to write imported skill roots: {}", error),
    })
}

fn skill_roots_file_path(app: &AppHandle) -> Result<PathBuf, SkillRootImportError> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| SkillRootImportError {
            code: SkillRootImportErrorCode::ReadFailed,
            message: format!("Failed to resolve app data directory: {}", error),
        })?;

    Ok(app_data_dir.join(SKILL_ROOTS_FILE_NAME))
}

// Scan the entire selected project so nested packages and custom skill folders
// are included, not only a fixed list of provider directories at its root.
fn repository_provider_root(root: ImportedSkillRoot) -> SkillRoot {
    SkillRoot {
        id: root.id,
        exists: PathBuf::from(&root.path).exists(),
        path: root.path.clone(),
        label: root.label.clone(),
        kind: SkillRootKind::Repository,
        provider: SkillProvider::Repository,
        scope_id: root.path,
        scope_label: root.label,
        scope_kind: SkillScopeKind::Repository,
    }
}

fn repository_provider_roots(root: ImportedSkillRoot) -> Vec<SkillRoot> {
    vec![repository_provider_root(root)]
}
