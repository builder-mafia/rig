use super::models::{
    BucketType, Skill, SkillListingError, SkillRoot, SkillRootDefinition, SkillUsage,
    SkillUsageError, SkillUsageSeries, WindowType,
};
use super::scanner::list_skills_from_root;
use super::usage::{list_skill_usage_tendencies_from_log, list_skill_usages_from_log};
use crate::skills::fs::expand_path;
use crate::skills::models::SkillListingErrorCode;

const SKILL_USAGE_LOG_PATH: &str = "~/rig-usage.jsonl";

pub const SKILL_ROOT_DEFINITIONS: &[SkillRootDefinition] = &[
    SkillRootDefinition {
        id: "agents-global",
        path: "~/.agents/skills",
        label: "Agents Global Skills",
    },
    SkillRootDefinition {
        id: "opencode-global",
        path: "~/.config/opencode/skills",
        label: "OpenCode Global Skills",
    },
    SkillRootDefinition {
        id: "claude-global",
        path: "~/.claude/skills",
        label: "Claude Global Skills",
    },
];

#[tauri::command]
pub fn list_skill_roots() -> Vec<SkillRoot> {
    SKILL_ROOT_DEFINITIONS
        .iter()
        .map(|definition| {
            let path = expand_path(definition.path);

            SkillRoot {
                id: definition.id.to_string(),
                path: path.to_string_lossy().to_string(),
                label: definition.label.to_string(),
                exists: path.exists(),
            }
        })
        .collect()
}

#[tauri::command]
pub fn list_skills(root_path: String) -> Result<Vec<Skill>, SkillListingError> {
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

    return list_skills_from_root(&path);
}

#[tauri::command]
pub fn list_skill_usages(window: Option<WindowType>) -> Result<Vec<SkillUsage>, SkillUsageError> {
    let path = expand_path(SKILL_USAGE_LOG_PATH);

    list_skill_usages_from_log(&path, window.unwrap_or(WindowType::Day))
}

#[tauri::command]
pub fn list_skill_usages_tendency(
    window: Option<WindowType>,
    bucket_type: Option<BucketType>,
) -> Result<Vec<SkillUsageSeries>, SkillUsageError> {
    let path = expand_path(SKILL_USAGE_LOG_PATH);

    list_skill_usage_tendencies_from_log(
        &path,
        window.unwrap_or(WindowType::Week),
        bucket_type.unwrap_or(BucketType::Hour),
    )
}
