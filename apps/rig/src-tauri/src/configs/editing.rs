use super::{files, models::*, property::edit_property};
use std::{
    fs,
    io::Write,
    path::{Path, PathBuf},
    sync::Mutex,
};

static SAVE_LOCK: Mutex<()> = Mutex::new(());

fn conflict() -> ConfigError {
    error(
        "conflict",
        "This configuration file changed outside Rig. Reload it before saving.",
    )
}

fn write_failed() -> ConfigError {
    error(
        "writeFailed",
        "Could not save this configuration file. Check its permissions.",
    )
}

pub(super) fn save_document(
    file: &ConfigFile,
    home: &Path,
    expected_revision: Option<&str>,
    edit: ConfigEdit,
) -> Result<ConfigDocument, ConfigError> {
    let _guard = SAVE_LOCK.lock().map_err(|_| write_failed())?;
    let (path, allowed) = files::resolve_path(file, home, |name| std::env::var(name).ok())?;
    let existing = files::checked_path(&path, home, &allowed)?;
    let current = existing
        .as_ref()
        .map(|target| files::read_bounded(target, files::MAX_DOCUMENT_BYTES))
        .transpose()?;
    if current.as_deref().map(files::revision).as_deref() != expected_revision {
        return Err(conflict());
    }
    let content = match edit {
        ConfigEdit::Source { content } => content,
        ConfigEdit::Property { path, value } => {
            if value.len() as u64 > files::MAX_DOCUMENT_BYTES {
                return Err(error("tooLarge", "This file exceeds the supported size."));
            }
            edit_property(&file.format, current.as_deref(), &path, Some(&value))?
        }
        ConfigEdit::RemoveProperty { path: property } => {
            let Some(current) = current.as_deref() else {
                return Ok(files::document(file, &path, None));
            };
            edit_property(&file.format, Some(current), &property, None)?
        }
    };
    if content.len() as u64 > files::MAX_DOCUMENT_BYTES {
        return Err(error("tooLarge", "This file exceeds the supported size."));
    }
    let unchanged = current.as_deref() == Some(&content);
    let document = files::document(file, &path, Some(content));
    if let Some(parse_error) = &document.parse_error {
        return Err(error("invalidConfig", parse_error));
    }
    if unchanged {
        return Ok(document);
    }

    let target = match &existing {
        Some(target) => target.clone(),
        None => new_file_path(&path, home, &allowed)?,
    };
    let permissions = existing
        .as_ref()
        .map(|target| fs::metadata(target).map(|data| data.permissions()))
        .transpose()
        .map_err(|_| write_failed())?;
    if permissions.as_ref().is_some_and(fs::Permissions::readonly) {
        return Err(write_failed());
    }
    let temporary = target.with_file_name(format!(".rig-config-{}.tmp", uuid::Uuid::new_v4()));
    let mut options = fs::OpenOptions::new();
    options.write(true).create_new(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    let mut handle = options.open(&temporary).map_err(|_| write_failed())?;
    let result = (|| {
        handle
            .write_all(document.content.as_deref().unwrap_or_default().as_bytes())
            .map_err(|_| write_failed())?;
        if let Some(permissions) = permissions {
            handle
                .set_permissions(permissions)
                .map_err(|_| write_failed())?;
        }
        handle.sync_all().map_err(|_| write_failed())?;
        drop(handle);

        if files::checked_path(&path, home, &allowed)? != existing {
            return Err(conflict());
        }
        if existing.is_some() {
            let latest = files::read_bounded(&target, files::MAX_DOCUMENT_BYTES)?;
            if Some(latest.as_str()) != current.as_deref() {
                return Err(conflict());
            }
            fs::rename(&temporary, &target).map_err(|_| write_failed())
        } else {
            if path
                .parent()
                .and_then(|parent| parent.canonicalize().ok())
                .as_deref()
                != target.parent()
            {
                return Err(conflict());
            }
            // Publish an entirely written new file without replacing a concurrent creation.
            fs::hard_link(&temporary, &target).map_err(|cause| {
                if cause.kind() == std::io::ErrorKind::AlreadyExists {
                    conflict()
                } else {
                    write_failed()
                }
            })
        }
    })();
    let _ = fs::remove_file(&temporary);
    result?;
    Ok(document)
}

fn new_file_path(path: &Path, home: &Path, allowed: &Path) -> Result<PathBuf, ConfigError> {
    let parent = path.parent().ok_or_else(write_failed)?;
    let mut ancestor = parent;
    let anchor = loop {
        match ancestor.symlink_metadata() {
            Ok(_) => break ancestor.canonicalize().map_err(|_| write_failed())?,
            Err(cause) if cause.kind() == std::io::ErrorKind::NotFound => {
                ancestor = ancestor.parent().ok_or_else(write_failed)?;
            }
            Err(_) => return Err(write_failed()),
        }
    };
    if !anchor.is_dir() || !files::within_roots(&anchor, home, allowed) {
        return Err(error(
            "invalidPath",
            "The configuration directory is outside the permitted paths.",
        ));
    }
    let expected = anchor.join(parent.strip_prefix(ancestor).map_err(|_| write_failed())?);
    fs::create_dir_all(&expected).map_err(|_| write_failed())?;
    if parent.canonicalize().map_err(|_| write_failed())? != expected {
        return Err(conflict());
    }
    Ok(expected.join(path.file_name().ok_or_else(write_failed)?))
}
