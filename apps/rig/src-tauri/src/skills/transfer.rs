use std::{
    fs, io,
    path::{Component, Path, PathBuf},
};

use serde::Serialize;

use super::{
    fs::expand_path,
    models::{SkillCopyError, SkillCopyErrorCode},
};

fn error(code: SkillCopyErrorCode, message: impl Into<String>) -> SkillCopyError {
    SkillCopyError {
        code,
        message: message.into(),
    }
}

fn copy_error(cause: io::Error) -> SkillCopyError {
    error(
        SkillCopyErrorCode::CopyFailed,
        format!("Could not copy skill: {cause}"),
    )
}

fn valid_relative(path: &Path, allow_empty: bool) -> bool {
    (allow_empty || !path.as_os_str().is_empty())
        && path
            .components()
            .all(|part| matches!(part, Component::Normal(_)))
}

fn source_directory(root: &str, relative: &str) -> Result<PathBuf, SkillCopyError> {
    let relative = Path::new(relative);
    if !valid_relative(relative, false) {
        return Err(error(
            SkillCopyErrorCode::OutsideRoot,
            "Choose a skill inside its source root.",
        ));
    }
    let root = expand_path(root)
        .canonicalize()
        .map_err(|e| error(SkillCopyErrorCode::PathNotFound, e.to_string()))?;
    let source = root
        .join(relative)
        .canonicalize()
        .map_err(|e| error(SkillCopyErrorCode::PathNotFound, e.to_string()))?;
    if source == root || !source.starts_with(&root) {
        return Err(error(
            SkillCopyErrorCode::OutsideRoot,
            "Source skill must stay inside its root.",
        ));
    }
    if !source.is_dir() {
        return Err(error(
            SkillCopyErrorCode::NotDirectory,
            "Source skill is not a folder.",
        ));
    }
    if !source.join("SKILL.md").is_file() {
        return Err(error(
            SkillCopyErrorCode::MissingSkillFile,
            "Source folder has no SKILL.md.",
        ));
    }
    // A pasted reference may be stale or forged. Never follow links out of a skill,
    // or recurse into symlink cycles while copying its supporting files.
    for entry in walkdir::WalkDir::new(&source).follow_links(false) {
        let entry = entry.map_err(|e| error(SkillCopyErrorCode::CopyFailed, e.to_string()))?;
        if !entry.file_type().is_dir() && !entry.file_type().is_file() {
            return Err(error(
                SkillCopyErrorCode::CopyFailed,
                "Skills containing symbolic links or special files cannot be copied.",
            ));
        }
    }
    Ok(source)
}

fn target_folder(root: &str, relative: &Path, source: &Path) -> Result<PathBuf, SkillCopyError> {
    if !valid_relative(relative, true) {
        return Err(error(
            SkillCopyErrorCode::OutsideRoot,
            "Target folder must stay inside its root.",
        ));
    }
    let root = expand_path(root);
    // Check the existing ancestor before creating a missing provider directory.
    let ancestor = root
        .ancestors()
        .find(|path| path.exists())
        .ok_or_else(|| {
            error(
                SkillCopyErrorCode::PathNotFound,
                "Target root has no existing parent.",
            )
        })?
        .canonicalize()
        .map_err(copy_error)?;
    if ancestor.starts_with(source) {
        return Err(error(
            SkillCopyErrorCode::OutsideRoot,
            "Cannot copy a skill into itself.",
        ));
    }
    fs::create_dir_all(&root).map_err(copy_error)?;
    let root = root.canonicalize().map_err(copy_error)?;
    let mut current = root.clone();
    for part in relative.components() {
        current.push(part);
        match fs::symlink_metadata(&current) {
            Ok(_) => {}
            Err(e) if e.kind() == io::ErrorKind::NotFound => {
                fs::create_dir(&current).map_err(copy_error)?;
            }
            Err(e) => return Err(copy_error(e)),
        }
        current = current.canonicalize().map_err(copy_error)?;
        if !current.starts_with(&root) || current.starts_with(source) {
            return Err(error(
                SkillCopyErrorCode::OutsideRoot,
                "Target folder must stay inside its root and outside the source skill.",
            ));
        }
        if !current.is_dir() {
            return Err(error(
                SkillCopyErrorCode::NotDirectory,
                "Target is not a folder.",
            ));
        }
    }
    if current.starts_with(source) {
        return Err(error(
            SkillCopyErrorCode::OutsideRoot,
            "Cannot copy a skill into itself.",
        ));
    }
    Ok(current)
}

fn copy_contents(source: &Path, target: &Path) -> io::Result<()> {
    for entry in fs::read_dir(source)? {
        let entry = entry?;
        let destination = target.join(entry.file_name());
        let kind = entry.file_type()?;
        if kind.is_dir() {
            fs::create_dir(&destination)?;
            copy_contents(&entry.path(), &destination)?;
        } else if kind.is_file() {
            fs::copy(entry.path(), destination)?;
        } else {
            return Err(io::Error::new(
                io::ErrorKind::InvalidInput,
                "Source contains a symbolic link or special file.",
            ));
        }
    }
    Ok(())
}

fn finish_copy(source: &Path, destination: &Path) -> Result<(), SkillCopyError> {
    if let Err(e) = copy_contents(source, destination) {
        // This directory was exclusively reserved by this operation.
        let _ = fs::remove_dir_all(destination);
        return Err(copy_error(e));
    }
    Ok(())
}

pub fn copy_exact(
    source_root: &str,
    source_relative: &str,
    target_root: &str,
    target_relative: &str,
) -> Result<(), SkillCopyError> {
    let target = Path::new(target_relative);
    if !valid_relative(target, false) {
        return Err(error(
            SkillCopyErrorCode::OutsideRoot,
            "Target skill must stay inside its root.",
        ));
    }
    let source = source_directory(source_root, source_relative)?;
    let parent = target_folder(
        target_root,
        target.parent().unwrap_or(Path::new("")),
        &source,
    )?;
    let destination = parent.join(target.file_name().unwrap());
    fs::create_dir(&destination).map_err(|e| {
        if e.kind() == io::ErrorKind::AlreadyExists {
            error(
                SkillCopyErrorCode::TargetExists,
                "Target skill already exists.",
            )
        } else {
            copy_error(e)
        }
    })?;
    finish_copy(&source, &destination)
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CopiedSkill {
    path: String,
}

fn copy_skill_into_folder(
    source_root_path: String,
    source_relative_path: String,
    target_root_path: String,
    target_relative_folder: String,
) -> Result<CopiedSkill, SkillCopyError> {
    let source = source_directory(&source_root_path, &source_relative_path)?;
    let folder = target_folder(
        &target_root_path,
        Path::new(&target_relative_folder),
        &source,
    )?;
    let name = Path::new(&source_relative_path)
        .file_name()
        .unwrap()
        .to_string_lossy();
    // Reserve the destination atomically so concurrent pastes never overwrite files.
    for suffix in 0..10_000 {
        let name = match suffix {
            0 => name.to_string(),
            1 => format!("{name}-copy"),
            _ => format!("{name}-copy-{suffix}"),
        };
        let destination = folder.join(name);
        match fs::create_dir(&destination) {
            Ok(()) => {
                finish_copy(&source, &destination)?;
                return Ok(CopiedSkill {
                    path: destination.to_string_lossy().into_owned(),
                });
            }
            Err(e) if e.kind() == io::ErrorKind::AlreadyExists => continue,
            Err(e) => return Err(copy_error(e)),
        }
    }
    Err(error(
        SkillCopyErrorCode::TargetExists,
        "Too many copies already exist in this folder.",
    ))
}

#[tauri::command]
pub async fn copy_skill_to_folder(
    source_root_path: String,
    source_relative_path: String,
    target_root_path: String,
    target_relative_folder: String,
) -> Result<CopiedSkill, SkillCopyError> {
    tauri::async_runtime::spawn_blocking(move || {
        copy_skill_into_folder(
            source_root_path,
            source_relative_path,
            target_root_path,
            target_relative_folder,
        )
    })
    .await
    .map_err(|cause| error(SkillCopyErrorCode::CopyFailed, cause.to_string()))?
}

#[cfg(test)]
mod tests {
    use super::*;

    struct Fixture(PathBuf);
    impl Fixture {
        fn new() -> Self {
            let root = std::env::temp_dir().join(format!("rig-transfer-{}", uuid::Uuid::new_v4()));
            fs::create_dir_all(root.join("source/nested/review/references")).unwrap();
            fs::write(
                root.join("source/nested/review/SKILL.md"),
                "review instructions",
            )
            .unwrap();
            fs::write(
                root.join("source/nested/review/references/guide.md"),
                "supporting file",
            )
            .unwrap();
            Self(root)
        }
        fn copy(&self, folder: &str) -> Result<CopiedSkill, SkillCopyError> {
            copy_skill_into_folder(
                self.0.join("source").to_string_lossy().into(),
                "nested/review".into(),
                self.0.join("target").to_string_lossy().into(),
                folder.into(),
            )
        }
    }
    impl Drop for Fixture {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }

    #[test]
    fn copies_support_files_and_allocates_unique_names_without_overwriting() {
        let f = Fixture::new();
        let first = PathBuf::from(f.copy(".agents/skills").unwrap().path);
        assert!(first.ends_with(".agents/skills/review"));
        assert_eq!(
            fs::read_to_string(first.join("references/guide.md")).unwrap(),
            "supporting file"
        );
        fs::write(first.join("SKILL.md"), "keep target edits").unwrap();
        assert!(f
            .copy(".agents/skills")
            .unwrap()
            .path
            .ends_with("review-copy"));
        assert!(f
            .copy(".agents/skills")
            .unwrap()
            .path
            .ends_with("review-copy-2"));
        assert_eq!(
            fs::read_to_string(first.join("SKILL.md")).unwrap(),
            "keep target edits"
        );
        assert_eq!(
            fs::read_to_string(f.0.join("source/nested/review/SKILL.md")).unwrap(),
            "review instructions"
        );
    }

    #[test]
    fn copies_into_the_same_parent_as_a_new_sibling() {
        let f = Fixture::new();
        let result = copy_skill_into_folder(
            f.0.join("source").to_string_lossy().into(),
            "nested/review".into(),
            f.0.join("source").to_string_lossy().into(),
            "nested".into(),
        )
        .unwrap();
        assert!(result.path.ends_with("nested/review-copy"));
        assert!(Path::new(&result.path).join("SKILL.md").exists());
    }

    #[test]
    fn rejects_parent_traversal_and_copying_into_the_source() {
        let f = Fixture::new();
        assert_eq!(
            f.copy("../escape").unwrap_err().code,
            SkillCopyErrorCode::OutsideRoot
        );
        let error = copy_skill_into_folder(
            f.0.join("source").to_string_lossy().into(),
            "nested/review".into(),
            f.0.join("source").to_string_lossy().into(),
            "nested/review/child".into(),
        )
        .unwrap_err();
        assert_eq!(error.code, SkillCopyErrorCode::OutsideRoot);
        assert!(!f.0.join("source/nested/review/child").exists());
        assert!(!f.0.join("escape").exists());
    }

    #[cfg(unix)]
    #[test]
    fn rejects_source_links_and_target_parent_escape_before_copying() {
        use std::os::unix::fs::symlink;
        let f = Fixture::new();
        symlink(&f.0, f.0.join("source/nested/review/loop")).unwrap();
        assert_eq!(f.copy("").unwrap_err().code, SkillCopyErrorCode::CopyFailed);
        assert!(!f.0.join("target").exists());
        fs::remove_file(f.0.join("source/nested/review/loop")).unwrap();
        fs::create_dir_all(f.0.join("target")).unwrap();
        fs::create_dir_all(f.0.join("outside")).unwrap();
        symlink(f.0.join("outside"), f.0.join("target/link")).unwrap();
        assert_eq!(
            f.copy("link/new-folder").unwrap_err().code,
            SkillCopyErrorCode::OutsideRoot
        );
        assert!(!f.0.join("outside/new-folder").exists());
    }

    #[cfg(unix)]
    #[test]
    fn removes_the_reserved_copy_if_the_source_changes_to_a_link() {
        let f = Fixture::new();
        let source = f.0.join("source/nested/review");
        source_directory(&f.0.join("source").to_string_lossy(), "nested/review").unwrap();
        std::os::unix::fs::symlink(&f.0, source.join("changed-after-validation")).unwrap();
        let destination = f.0.join("reserved");
        fs::create_dir(&destination).unwrap();
        assert!(finish_copy(&source, &destination).is_err());
        assert!(!destination.exists());
        assert!(source.join("SKILL.md").exists());
    }
}
