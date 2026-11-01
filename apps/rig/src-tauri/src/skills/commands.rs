use std::fs;
use std::path::{Component, Path};

use super::archive::{list_archived_skills_from_root, restore_skill_at_path};
use super::history::{
    list_skill_versions_at_path, read_skill_version_at_path, restore_skill_version_at_path,
    update_global_skill, SkillHistoryError, SkillUpdateResult, SkillVersionDetail,
    SkillVersionSummary,
};
use super::models::{
    Skill, SkillArchiveError, SkillCopyError, SkillDeletionError, SkillDeletionErrorCode,
    SkillListingError, SkillProvider, SkillRoot, SkillRootDefinition, SkillRootImportError,
    SkillRootKind, SkillScopeKind,
};
use super::root_store::{
    import_skill_root_from_path, list_imported_skill_roots, remove_imported_skill_root,
};
use super::scanner::list_skills_from_root;
use super::updates::{check_global_skill_updates, SkillUpdateStatus};
use crate::skills::fs::expand_path;
use crate::skills::models::SkillListingErrorCode;

#[tauri::command]
pub async fn check_skill_updates(force: Option<bool>) -> Vec<SkillUpdateStatus> {
    check_global_skill_updates(force.unwrap_or(false)).await
}

#[tauri::command]
pub async fn update_skill(name: String) -> Result<SkillUpdateResult, SkillHistoryError> {
    update_global_skill(name).await
}

#[tauri::command]
pub fn list_skill_versions(
    root_path: String,
    relative_path: String,
) -> Result<Vec<SkillVersionSummary>, SkillHistoryError> {
    list_skill_versions_at_path(&root_path, &relative_path)
}

#[tauri::command]
pub fn read_skill_version(
    root_path: String,
    relative_path: String,
    version_id: String,
) -> Result<SkillVersionDetail, SkillHistoryError> {
    read_skill_version_at_path(&root_path, &relative_path, &version_id)
}

#[tauri::command]
pub fn restore_skill_version(
    root_path: String,
    relative_path: String,
    version_id: String,
) -> Result<SkillVersionSummary, SkillHistoryError> {
    restore_skill_version_at_path(&root_path, &relative_path, &version_id)
}

pub const SKILL_ROOT_DEFINITIONS: &[SkillRootDefinition] = &[
    SkillRootDefinition {
        id: "global-codex",
        path: "~/.codex/skills",
        label: "Codex",
        provider: SkillProvider::Agents,
        scope_id: "global",
        scope_label: "Global",
        scope_kind: SkillScopeKind::Global,
    },
    SkillRootDefinition {
        id: "global-agents",
        path: "~/.agents/skills",
        label: "Codex",
        provider: SkillProvider::Agents,
        scope_id: "global",
        scope_label: "Global",
        scope_kind: SkillScopeKind::Global,
    },
    SkillRootDefinition {
        id: "global-opencode",
        path: "~/.config/opencode/skills",
        label: "OpenCode",
        provider: SkillProvider::OpenCode,
        scope_id: "global",
        scope_label: "Global",
        scope_kind: SkillScopeKind::Global,
    },
    SkillRootDefinition {
        id: "global-claude",
        path: "~/.claude/skills",
        label: "Claude",
        provider: SkillProvider::Claude,
        scope_id: "global",
        scope_label: "Global",
        scope_kind: SkillScopeKind::Global,
    },
    SkillRootDefinition {
        id: "global-hermes",
        path: "~/.hermes/skills",
        label: "Hermes",
        provider: SkillProvider::Hermes,
        scope_id: "global",
        scope_label: "Global",
        scope_kind: SkillScopeKind::Global,
    },
    SkillRootDefinition {
        id: "global-cursor",
        path: "~/.cursor/skills",
        label: "Cursor",
        provider: SkillProvider::Cursor,
        scope_id: "global",
        scope_label: "Global",
        scope_kind: SkillScopeKind::Global,
    },
];

#[tauri::command]
pub fn list_skill_roots(app: tauri::AppHandle) -> Vec<SkillRoot> {
    let mut roots = SKILL_ROOT_DEFINITIONS
        .iter()
        .map(|definition| {
            let path = expand_path(definition.path);

            SkillRoot {
                id: definition.id.to_string(),
                path: path.to_string_lossy().to_string(),
                label: definition.label.to_string(),
                exists: path.exists(),
                kind: SkillRootKind::Default,
                provider: definition.provider.clone(),
                scope_id: definition.scope_id.to_string(),
                scope_label: definition.scope_label.to_string(),
                scope_kind: definition.scope_kind.clone(),
            }
        })
        .collect::<Vec<_>>();

    roots.extend(list_imported_skill_roots(&app));
    roots
}

#[tauri::command]
pub fn import_skill_root(
    app: tauri::AppHandle,
    path: String,
) -> Result<SkillRoot, SkillRootImportError> {
    import_skill_root_from_path(&app, expand_path(path.as_str()))
}

#[tauri::command]
pub fn remove_skill_root(
    app: tauri::AppHandle,
    root_id: String,
) -> Result<(), SkillRootImportError> {
    remove_imported_skill_root(&app, root_id)
}

#[tauri::command]
pub fn list_skills(root: SkillRoot) -> Result<Vec<Skill>, SkillListingError> {
    let path = expand_path(root.path.as_str());

    if !path.exists() {
        return Err(SkillListingError {
            code: SkillListingErrorCode::PathNotFound,
            message: format!("Skill root path does not exist: {}", root.path),
        });
    }

    if !path.is_dir() {
        return Err(SkillListingError {
            code: SkillListingErrorCode::NotDirectory,
            message: format!("Skill root path is not a directory: {}", root.path),
        });
    }

    let root = SkillRoot {
        path: path.to_string_lossy().to_string(),
        ..root
    };

    return list_skills_from_root(&root);
}

#[tauri::command]
pub fn copy_skill(
    source_root_path: String,
    source_relative_path: String,
    target_root_path: String,
    target_relative_path: String,
) -> Result<(), SkillCopyError> {
    super::transfer::copy_exact(
        &source_root_path,
        &source_relative_path,
        &target_root_path,
        &target_relative_path,
    )
}

#[tauri::command]
pub fn list_archived_skills(root_path: String) -> Result<Vec<Skill>, SkillListingError> {
    let path = expand_path(root_path.as_str());

    if !path.exists() {
        return Err(SkillListingError {
            code: SkillListingErrorCode::PathNotFound,
            message: format!("Skill root path does not exist: {}", root_path),
        });
    }

    if !path.is_dir() {
        return Err(SkillListingError {
            code: SkillListingErrorCode::NotDirectory,
            message: format!("Skill root path is not a directory: {}", root_path),
        });
    }

    list_archived_skills_from_root(&path)
}

#[tauri::command]
pub fn restore_skill(root_path: String, relative_path: String) -> Result<(), SkillArchiveError> {
    restore_skill_at_path(
        &expand_path(root_path.as_str()),
        Path::new(relative_path.as_str()),
    )
}

#[tauri::command]
pub fn remove_skill(
    root_path: String,
    relative_path: String,
    preserve_directory: Option<bool>,
) -> Result<(), SkillDeletionError> {
    let root_path = expand_path(root_path.as_str());

    let relative_path = Path::new(relative_path.as_str());

    if relative_path.is_absolute()
        || relative_path
            .components()
            .any(|component| matches!(component, Component::ParentDir | Component::Prefix(_)))
    {
        return Err(SkillDeletionError {
            code: SkillDeletionErrorCode::OutsideRoot,
            message: "Skill path must stay inside the selected root.".to_string(),
        });
    }

    let root_path = root_path
        .canonicalize()
        .map_err(|error| SkillDeletionError {
            code: SkillDeletionErrorCode::PathNotFound,
            message: format!("Skill root path does not exist: {}", error),
        })?;

    if !root_path.is_dir() {
        return Err(SkillDeletionError {
            code: SkillDeletionErrorCode::NotDirectory,
            message: "Skill root path is not a directory.".to_string(),
        });
    }

    let mut candidate = root_path.clone();
    for component in relative_path.components() {
        candidate.push(component);
        if candidate.is_symlink() {
            return Err(SkillDeletionError {
                code: SkillDeletionErrorCode::OutsideRoot,
                message: "Refusing to delete through a symbolic link.".to_string(),
            });
        }
    }

    let skill_dir = root_path
        .join(relative_path)
        .canonicalize()
        .map_err(|error| SkillDeletionError {
            code: SkillDeletionErrorCode::PathNotFound,
            message: format!("Skill path does not exist: {}", error),
        })?;

    if !skill_dir.starts_with(&root_path) {
        return Err(SkillDeletionError {
            code: SkillDeletionErrorCode::OutsideRoot,
            message: "Skill path must stay inside the selected root.".to_string(),
        });
    }

    if !skill_dir.is_dir() {
        return Err(SkillDeletionError {
            code: SkillDeletionErrorCode::NotDirectory,
            message: "Skill path is not a directory.".to_string(),
        });
    }

    let skill_file = skill_dir.join("SKILL.md");
    if skill_file.is_symlink() {
        return Err(SkillDeletionError {
            code: SkillDeletionErrorCode::OutsideRoot,
            message: "Refusing to delete a symbolic-link skill file.".to_string(),
        });
    }
    if !skill_file.is_file() {
        return Err(SkillDeletionError {
            code: SkillDeletionErrorCode::MissingSkillFile,
            message: "Skill directory does not contain SKILL.md.".to_string(),
        });
    }

    // A project/root or the folder being cleared must never be removed wholesale.
    let result = if skill_dir == root_path || preserve_directory.unwrap_or(false) {
        fs::remove_file(&skill_file)
    } else {
        fs::remove_dir_all(&skill_dir)
    };
    result.map_err(|error| SkillDeletionError {
        code: SkillDeletionErrorCode::DeleteFailed,
        message: format!("Failed to remove skill: {}", error),
    })
}

#[cfg(test)]
mod tests {
    use super::super::models::SkillCopyErrorCode;
    use super::*;

    #[test]
    fn removing_root_skill_preserves_project_and_other_skills() {
        let root = make_test_sandbox("remove-root");
        fs::write(root.join("SKILL.md"), "root skill").unwrap();
        fs::write(root.join("README.md"), "project").unwrap();
        fs::create_dir(root.join("child")).unwrap();
        fs::write(root.join("child/SKILL.md"), "child").unwrap();
        remove_skill(root.to_string_lossy().into(), "".into(), None).unwrap();
        assert!(!root.join("SKILL.md").exists());
        assert!(root.join("README.md").is_file());
        assert!(root.join("child/SKILL.md").is_file());
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn removing_folder_skills_preserves_selected_folder_and_siblings() {
        let root = make_test_sandbox("remove-folder");
        fs::create_dir_all(root.join("tools/child/references")).unwrap();
        fs::write(root.join("tools/child/SKILL.md"), "child").unwrap();
        fs::write(root.join("tools/child/references/details.md"), "details").unwrap();
        fs::write(root.join("tools/SKILL.md"), "tools").unwrap();
        fs::write(root.join("tools/README.md"), "keep").unwrap();
        fs::create_dir(root.join("tools-other")).unwrap();
        fs::write(root.join("tools-other/SKILL.md"), "sibling").unwrap();
        let path = root.to_string_lossy().to_string();
        remove_skill(path.clone(), "tools/child".into(), None).unwrap();
        remove_skill(path, "tools".into(), Some(true)).unwrap();
        assert!(!root.join("tools/child").exists());
        assert!(!root.join("tools/SKILL.md").exists());
        assert!(root.join("tools/README.md").is_file());
        assert!(root.join("tools-other/SKILL.md").is_file());
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn removing_skills_rejects_escape_and_non_skill_folders() {
        let root = make_test_sandbox("remove-escape");
        fs::create_dir(root.join("ordinary")).unwrap();
        fs::write(root.join("ordinary/README.md"), "keep").unwrap();
        for relative in ["../outside", "/tmp/outside"] {
            let error =
                remove_skill(root.to_string_lossy().into(), relative.into(), None).unwrap_err();
            assert!(matches!(error.code, SkillDeletionErrorCode::OutsideRoot));
        }
        let error =
            remove_skill(root.to_string_lossy().into(), "ordinary".into(), None).unwrap_err();
        assert!(matches!(error.code, SkillDeletionErrorCode::MissingSkillFile));
        assert!(root.join("ordinary/README.md").is_file());
        fs::remove_dir_all(root).unwrap();
    }

    #[cfg(unix)]
    #[test]
    fn removing_skills_never_follows_directory_or_file_symlinks() {
        use std::os::unix::fs::symlink;
        let root = make_test_sandbox("remove-links");
        fs::create_dir(root.join("original")).unwrap();
        fs::write(root.join("original/SKILL.md"), "keep").unwrap();
        symlink(root.join("original"), root.join("alias")).unwrap();
        fs::create_dir(root.join("file-link")).unwrap();
        symlink(
            root.join("original/SKILL.md"),
            root.join("file-link/SKILL.md"),
        )
        .unwrap();
        for relative in ["alias", "file-link"] {
            let error =
                remove_skill(root.to_string_lossy().into(), relative.into(), None).unwrap_err();
            assert!(matches!(error.code, SkillDeletionErrorCode::OutsideRoot));
        }
        assert!(root.join("original/SKILL.md").is_file());
        fs::remove_dir_all(root).unwrap();
    }

    #[test]
    fn default_roots_include_hermes_global_provider_root() {
        let hermes_root = SKILL_ROOT_DEFINITIONS
            .iter()
            .find(|definition| definition.id == "global-hermes")
            .expect("Hermes global root should be registered");

        assert_eq!(hermes_root.path, "~/.hermes/skills");
        assert_eq!(hermes_root.label, "Hermes");
        assert_eq!(hermes_root.provider, SkillProvider::Hermes);
        assert_eq!(hermes_root.scope_id, "global");
        assert_eq!(hermes_root.scope_label, "Global");
        assert_eq!(hermes_root.scope_kind, SkillScopeKind::Global);
    }

    #[test]
    fn copy_skill_copies_directory_into_target_root() {
        let sandbox = make_test_sandbox("copy-success");
        let source_root = sandbox.join("agents");
        let target_root = sandbox.join("hermes");
        let source_skill = source_root.join("test-skill");
        fs::create_dir_all(source_skill.join("references")).unwrap();
        fs::write(
            source_skill.join("SKILL.md"),
            "---\nname: test-skill\ndescription: Test skill\n---\n",
        )
        .unwrap();
        fs::write(source_skill.join("references/details.md"), "details").unwrap();

        copy_skill(
            source_root.to_string_lossy().to_string(),
            "test-skill".to_string(),
            target_root.to_string_lossy().to_string(),
            "test-skill".to_string(),
        )
        .unwrap();

        assert!(target_root.join("test-skill/SKILL.md").is_file());
        assert_eq!(
            fs::read_to_string(target_root.join("test-skill/references/details.md")).unwrap(),
            "details"
        );

        let _ = fs::remove_dir_all(sandbox);
    }

    #[test]
    fn copy_skill_rejects_parent_directory_escape() {
        let sandbox = make_test_sandbox("copy-escape");
        let source_root = sandbox.join("agents");
        let target_root = sandbox.join("hermes");
        fs::create_dir_all(source_root.join("test-skill")).unwrap();
        fs::write(source_root.join("test-skill/SKILL.md"), "skill").unwrap();

        let error = copy_skill(
            source_root.to_string_lossy().to_string(),
            "../test-skill".to_string(),
            target_root.to_string_lossy().to_string(),
            "test-skill".to_string(),
        )
        .unwrap_err();

        assert_eq!(error.code, SkillCopyErrorCode::OutsideRoot);

        let _ = fs::remove_dir_all(sandbox);
    }

    #[test]
    fn copy_skill_rejects_existing_target() {
        let sandbox = make_test_sandbox("copy-existing-target");
        let source_root = sandbox.join("agents");
        let target_root = sandbox.join("hermes");
        fs::create_dir_all(source_root.join("test-skill")).unwrap();
        fs::write(source_root.join("test-skill/SKILL.md"), "source").unwrap();
        fs::create_dir_all(target_root.join("test-skill")).unwrap();
        fs::write(target_root.join("test-skill/SKILL.md"), "target").unwrap();

        let error = copy_skill(
            source_root.to_string_lossy().to_string(),
            "test-skill".to_string(),
            target_root.to_string_lossy().to_string(),
            "test-skill".to_string(),
        )
        .unwrap_err();

        assert_eq!(error.code, SkillCopyErrorCode::TargetExists);
        assert_eq!(
            fs::read_to_string(target_root.join("test-skill/SKILL.md")).unwrap(),
            "target"
        );

        let _ = fs::remove_dir_all(sandbox);
    }

    fn make_test_sandbox(name: &str) -> std::path::PathBuf {
        let sandbox =
            std::env::temp_dir().join(format!("rig-skill-copy-{}-{}", name, std::process::id()));
        let _ = fs::remove_dir_all(&sandbox);
        fs::create_dir_all(&sandbox).unwrap();
        sandbox
    }
}
