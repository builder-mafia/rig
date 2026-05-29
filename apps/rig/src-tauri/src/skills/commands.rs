use super::models::{Skill, SkillRoot, SkillRootDefinition};
use super::scanner::list_skills_from_root;
use crate::skills::fs::expand_path;

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
pub fn list_skills(root_path: String) -> Result<Vec<Skill>, String> {
    let path = expand_path(root_path.as_str());

    if !path.exists() {
        return Err(format!("Skill root path does not exist: {}", root_path));
    }

    if !path.is_dir() {
        return Err(format!("Skill root path is not a directory: {}", root_path));
    }

    return list_skills_from_root(&path);
}
