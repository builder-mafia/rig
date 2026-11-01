use super::fs::expand_path;
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::{
    fs,
    io::Write,
    path::{Component, Path, PathBuf},
    sync::Mutex,
};

static SAVE_LOCK: Mutex<()> = Mutex::new(());

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentError {
    code: &'static str,
    message: String,
}
fn error(code: &'static str, message: impl ToString) -> DocumentError {
    DocumentError {
        code,
        message: message.to_string(),
    }
}
fn io_error(cause: std::io::Error) -> DocumentError {
    error("io", cause)
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillDocument {
    content: String,
    revision: String,
}
fn revision(content: &str) -> String {
    format!("{:x}", Sha256::digest(content.as_bytes()))
}

fn skill_file(root: &str, relative: &str) -> Result<PathBuf, DocumentError> {
    let relative = Path::new(relative);
    if relative
        .components()
        .any(|part| !matches!(part, Component::Normal(_)))
    {
        return Err(error("invalidPath", "Skill must stay inside its root."));
    }
    let root = expand_path(root).canonicalize().map_err(io_error)?;
    let file = root
        .join(relative)
        .join("SKILL.md")
        .canonicalize()
        .map_err(io_error)?;
    if !file.starts_with(&root)
        || !file.is_file()
        || file
            .strip_prefix(&root)
            .unwrap()
            .components()
            .any(|part| part.as_os_str() == ".archive" || part.as_os_str() == ".backups")
    {
        return Err(error(
            "invalidPath",
            "Choose an existing, unarchived skill inside its root.",
        ));
    }
    Ok(file)
}
fn read_document(root: &str, relative: &str) -> Result<SkillDocument, DocumentError> {
    let content = fs::read_to_string(skill_file(root, relative)?).map_err(io_error)?;
    Ok(SkillDocument {
        revision: revision(&content),
        content,
    })
}
fn save_document(
    root: &str,
    relative: &str,
    content: &str,
    expected: &str,
) -> Result<SkillDocument, DocumentError> {
    let _guard = SAVE_LOCK
        .lock()
        .map_err(|_| error("io", "Save lock unavailable."))?;
    let path = skill_file(root, relative)?;
    let current = fs::read_to_string(&path).map_err(io_error)?;
    if revision(&current) != expected {
        return Err(error(
            "conflict",
            "This file was changed outside this editor. Reload before saving.",
        ));
    }
    if current != content {
        let permissions = fs::metadata(&path).map_err(io_error)?.permissions();
        if permissions.readonly() {
            return Err(error("io", "This file is read-only."));
        }
        let temporary = path.with_file_name(format!(".rig-{}.tmp", uuid::Uuid::new_v4()));
        let result = (|| -> Result<(), DocumentError> {
            let mut file = fs::OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(&temporary)
                .map_err(io_error)?;
            file.write_all(content.as_bytes()).map_err(io_error)?;
            file.set_permissions(permissions).map_err(io_error)?;
            file.sync_all().map_err(io_error)?;
            // Check again after preparing the replacement, including changes to symlinks.
            if skill_file(root, relative)? != path
                || revision(&fs::read_to_string(&path).map_err(io_error)?) != expected
            {
                return Err(error(
                    "conflict",
                    "This file changed while saving. Reload before saving.",
                ));
            }
            fs::rename(&temporary, &path).map_err(io_error)
        })();
        if result.is_err() {
            let _ = fs::remove_file(&temporary);
        }
        result?;
    }
    Ok(SkillDocument {
        content: content.to_string(),
        revision: revision(content),
    })
}

#[tauri::command]
pub async fn read_skill_document(
    root_path: String,
    relative_path: String,
) -> Result<SkillDocument, DocumentError> {
    tauri::async_runtime::spawn_blocking(move || read_document(&root_path, &relative_path))
        .await
        .map_err(|e| error("io", e))?
}
#[tauri::command]
pub async fn save_skill_document(
    root_path: String,
    relative_path: String,
    content: String,
    expected_revision: String,
) -> Result<SkillDocument, DocumentError> {
    tauri::async_runtime::spawn_blocking(move || {
        save_document(&root_path, &relative_path, &content, &expected_revision)
    })
    .await
    .map_err(|e| error("io", e))?
}

#[derive(Clone, Copy, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum SkillEditor {
    Cursor,
    Finder,
    Vscode,
    Webstorm,
    Zed,
}
impl SkillEditor {
    #[cfg(target_os = "macos")]
    fn bundle_ids(self) -> &'static [&'static str] {
        match self {
            Self::Cursor => &["com.todesktop.230313mzl4w4u92"],
            Self::Finder => &["com.apple.finder"],
            Self::Vscode => &["com.microsoft.VSCode", "com.microsoft.VSCodeInsiders"],
            Self::Webstorm => &["com.jetbrains.WebStorm", "com.jetbrains.WebStorm-EAP"],
            Self::Zed => &["dev.zed.Zed", "dev.zed.Zed-Preview"],
        }
    }
    fn from_id(id: &str) -> Option<Self> {
        match id {
            "cursor" => Some(Self::Cursor),
            "finder" => Some(Self::Finder),
            "vscode" => Some(Self::Vscode),
            "webstorm" => Some(Self::Webstorm),
            "zed" => Some(Self::Zed),
            _ => None,
        }
    }
}

#[cfg(target_os = "macos")]
fn application_path(editor: SkillEditor) -> Option<PathBuf> {
    use objc2_app_kit::NSWorkspace;
    use objc2_foundation::NSString;
    let workspace = NSWorkspace::sharedWorkspace();
    editor.bundle_ids().iter().find_map(|id| {
        let url = workspace.URLForApplicationWithBundleIdentifier(&NSString::from_str(id))?;
        let path = PathBuf::from(url.path()?.to_string());
        path.is_dir().then_some(path)
    })
}
#[tauri::command]
pub async fn list_skill_editors() -> Result<Vec<SkillEditor>, DocumentError> {
    tauri::async_runtime::spawn_blocking(|| {
        #[cfg(target_os = "macos")]
        {
            [
                SkillEditor::Cursor,
                SkillEditor::Finder,
                SkillEditor::Vscode,
                SkillEditor::Webstorm,
                SkillEditor::Zed,
            ]
            .into_iter()
            .filter(|editor| application_path(*editor).is_some())
            .collect()
        }
        #[cfg(not(target_os = "macos"))]
        {
            Vec::new()
        }
    })
    .await
    .map_err(|e| error("io", e))
}
#[tauri::command]
pub async fn open_skill_in_editor(
    root_path: String,
    relative_path: String,
    editor: String,
) -> Result<(), DocumentError> {
    tauri::async_runtime::spawn_blocking(move || {
        let editor = SkillEditor::from_id(&editor)
            .ok_or_else(|| error("unavailable", "Unsupported editor."))?;
        let file = skill_file(&root_path, &relative_path)?;
        #[cfg(target_os = "macos")]
        {
            let app = application_path(editor)
                .ok_or_else(|| error("unavailable", "This application is no longer installed."))?;
            let mut command = std::process::Command::new("/usr/bin/open");
            if matches!(editor, SkillEditor::Finder) {
                command.arg("-R").arg(&file);
            } else {
                command.arg("-a").arg(app).arg(&file);
            }
            let output = command.output().map_err(io_error)?;
            if !output.status.success() {
                return Err(error("openFailed", String::from_utf8_lossy(&output.stderr)));
            }
            Ok(())
        }
        #[cfg(not(target_os = "macos"))]
        {
            let _ = (file, editor);
            Err(error(
                "unavailable",
                "This application is unavailable on this platform.",
            ))
        }
    })
    .await
    .map_err(|e| error("io", e))?
}

#[cfg(test)]
mod tests {
    use super::*;
    struct Fixture(PathBuf);
    impl Fixture {
        fn new() -> Self {
            let root = std::env::temp_dir().join(format!("rig-editor-{}", uuid::Uuid::new_v4()));
            fs::create_dir_all(root.join("review")).unwrap();
            fs::write(
                root.join("review/SKILL.md"),
                "---\nname: review\ndescription: Test\ncustom: keep\n---\n# Review\n",
            )
            .unwrap();
            Self(root)
        }
        fn root(&self) -> &str {
            self.0.to_str().unwrap()
        }
    }
    impl Drop for Fixture {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }
    #[test]
    fn reads_and_saves_exact_raw_file_including_frontmatter() {
        let f = Fixture::new();
        let before = read_document(f.root(), "review").unwrap();
        assert!(before.content.contains("custom: keep"));
        let content = before.content.replace("# Review", "# Edited\n\n새 내용");
        let after = save_document(f.root(), "review", &content, &before.revision).unwrap();
        assert_eq!(
            fs::read_to_string(f.0.join("review/SKILL.md")).unwrap(),
            content
        );
        assert_ne!(before.revision, after.revision);
        assert_eq!(
            save_document(f.root(), "review", &content, &after.revision)
                .unwrap()
                .revision,
            after.revision
        );
    }
    #[test]
    fn preserves_external_edits_and_can_repair_invalid_or_empty_files() {
        let f = Fixture::new();
        let before = read_document(f.root(), "review").unwrap();
        fs::write(f.0.join("review/SKILL.md"), "external edits").unwrap();
        assert_eq!(
            save_document(f.root(), "review", "my edits", &before.revision)
                .unwrap_err()
                .code,
            "conflict"
        );
        let current = read_document(f.root(), "review").unwrap();
        assert_eq!(current.content, "external edits");
        save_document(f.root(), "review", "", &current.revision).unwrap();
        assert_eq!(read_document(f.root(), "review").unwrap().content, "");
        assert_eq!(fs::read_dir(f.0.join("review")).unwrap().count(), 1);
    }
    #[test]
    fn supports_root_skills_but_rejects_traversal_and_missing_files() {
        let f = Fixture::new();
        fs::write(f.0.join("SKILL.md"), "root skill").unwrap();
        assert_eq!(read_document(f.root(), "").unwrap().content, "root skill");
        for path in ["../review", "/tmp", "missing"] {
            assert!(read_document(f.root(), path).is_err());
        }
        assert!(SkillEditor::from_id("shell").is_none());
    }
    #[cfg(unix)]
    #[test]
    fn rejects_file_symlinks_outside_root_and_preserves_permissions() {
        use std::os::unix::fs::{symlink, PermissionsExt};
        let f = Fixture::new();
        let outside = Fixture::new();
        fs::remove_file(f.0.join("review/SKILL.md")).unwrap();
        symlink(
            outside.0.join("review/SKILL.md"),
            f.0.join("review/SKILL.md"),
        )
        .unwrap();
        assert_eq!(
            read_document(f.root(), "review").unwrap_err().code,
            "invalidPath"
        );
        let file = outside.0.join("review/SKILL.md");
        fs::set_permissions(&file, fs::Permissions::from_mode(0o640)).unwrap();
        let before = read_document(outside.root(), "review").unwrap();
        save_document(outside.root(), "review", "edited", &before.revision).unwrap();
        assert_eq!(
            fs::metadata(&file).unwrap().permissions().mode() & 0o777,
            0o640
        );
        fs::set_permissions(&file, fs::Permissions::from_mode(0o440)).unwrap();
        let current = read_document(outside.root(), "review").unwrap();
        assert!(save_document(outside.root(), "review", "changed", &current.revision).is_err());
    }
}
