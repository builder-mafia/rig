#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillRoot {
    pub id: String,
    pub path: String,
    pub label: String,
    pub exists: bool,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Skill {
    pub id: String,
    pub name: String,
    pub root_path: String,
    pub relative_path: String,
    pub has_skill_file: bool,
    pub description: Option<String>,
    pub is_valid: bool,
    pub validation_errors: Vec<SkillValidationError>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillDetail {
    pub skill: Skill,
    pub content: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum SkillValidationErrorCode {
    MissingSkillFile,
    EmptySkillFile,
    InvalidUtf8,
    ReadFailed,
    NotDirectory,
    OutsideRoot,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillValidationError {
    pub code: SkillValidationErrorCode,
    pub message: String,
}
