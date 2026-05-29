pub struct SkillRootDefinition {
    pub id: &'static str,
    pub path: &'static str,
    pub label: &'static str,
}

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
    pub content: String,
    pub description: Option<String>,
    pub is_valid: bool,
    pub validation_error: Option<SkillValidationError>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum SkillValidationErrorCode {
    MissingSkillFile,
    EmptySkillFile,
    EmptyContent,
    InvalidUtf8,
    ReadFailed,
    NotDirectory,
    OutsideRoot,
    MissingFrontMatter,
    InvalidFrontMatter,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillValidationError {
    pub code: SkillValidationErrorCode,
    pub message: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum SkillListingErrorCode {
    PathNotFound,
    NotDirectory,
    ReadFailed,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillListingError {
    pub code: SkillListingErrorCode,
    pub message: String,
}
