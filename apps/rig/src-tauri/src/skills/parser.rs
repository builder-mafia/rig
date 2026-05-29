use gray_matter::engine::YAML;
use gray_matter::Matter;
use serde::Deserialize;

use super::models::{SkillValidationError, SkillValidationErrorCode};

#[derive(Debug)]
pub struct ParsedSkillFile {
    pub name: String,
    pub description: Option<String>,
    pub content: String,
}

#[derive(Debug, Deserialize)]
struct SkillFrontMatter {
    name: String,
    description: String,
}

pub fn parse_skill_file_content(content: &str) -> Result<ParsedSkillFile, SkillValidationError> {
    if content.trim().is_empty() {
        return Err(SkillValidationError {
            code: SkillValidationErrorCode::EmptySkillFile,
            message: "SKILL.md is empty".to_string(),
        });
    }

    let matter = Matter::<YAML>::new();
    let parsed =
        matter
            .parse::<SkillFrontMatter>(content)
            .map_err(|error| SkillValidationError {
                code: SkillValidationErrorCode::InvalidFrontMatter,
                message: format!("Failed to parse SKILL.md frontmatter: {}", error),
            })?;

    let frontmatter = parsed.data.ok_or_else(|| SkillValidationError {
        code: SkillValidationErrorCode::MissingFrontMatter,
        message: "SKILL.md is missing frontmatter".to_string(),
    })?;

    if frontmatter.name.trim().is_empty() {
        return Err(SkillValidationError {
            code: SkillValidationErrorCode::InvalidFrontMatter,
            message: "SKILL.md frontmatter must include a name".to_string(),
        });
    }

    if frontmatter.description.trim().is_empty() {
        return Err(SkillValidationError {
            code: SkillValidationErrorCode::InvalidFrontMatter,
            message: "SKILL.md frontmatter must include a description".to_string(),
        });
    }

    let content = parsed.content.trim().to_string();

    if content.is_empty() {
        return Err(SkillValidationError {
            code: SkillValidationErrorCode::EmptyContent,
            message: "SKILL.md content is empty".to_string(),
        });
    }

    Ok(ParsedSkillFile {
        name: frontmatter.name,
        description: Some(frontmatter.description),
        content,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_valid_skill_file() {
        let content = r#"---
name: Test Skill
description: Test description
---
Use this skill for testing.
"#;

        let parsed = parse_skill_file_content(content).unwrap();

        assert_eq!(parsed.name, "Test Skill");
        assert_eq!(parsed.description, Some("Test description".to_string()));
        assert_eq!(parsed.content, "Use this skill for testing.");
    }

    #[test]
    fn returns_empty_skill_file_for_blank_content() {
        let error = parse_skill_file_content("   \n\t").unwrap_err();

        assert!(matches!(
            error.code,
            SkillValidationErrorCode::EmptySkillFile
        ));
    }

    #[test]
    fn returns_missing_frontmatter_when_frontmatter_is_absent() {
        let error = parse_skill_file_content("Use this skill for testing.").unwrap_err();

        assert!(matches!(
            error.code,
            SkillValidationErrorCode::MissingFrontMatter
        ));
    }

    #[test]
    fn returns_invalid_frontmatter_when_name_is_missing() {
        let content = r#"---
description: Test description
---
Use this skill for testing.
"#;

        let error = parse_skill_file_content(content).unwrap_err();

        assert!(matches!(
            error.code,
            SkillValidationErrorCode::InvalidFrontMatter
        ));
    }

    #[test]
    fn returns_invalid_frontmatter_when_description_is_missing() {
        let content = r#"---
name: Test Skill
---
Use this skill for testing.
"#;

        let error = parse_skill_file_content(content).unwrap_err();

        assert!(matches!(
            error.code,
            SkillValidationErrorCode::InvalidFrontMatter
        ));
    }

    #[test]
    fn returns_empty_content_when_body_is_missing() {
        let content = r#"---
name: Test Skill
description: Test description
---
"#;

        let error = parse_skill_file_content(content).unwrap_err();

        assert!(matches!(error.code, SkillValidationErrorCode::EmptyContent));
    }
}
