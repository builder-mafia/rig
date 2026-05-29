use std::path::PathBuf;

pub fn expand_path(path: &str) -> PathBuf {
    PathBuf::from(shellexpand::tilde(path).into_owned())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn expands_tilde_path() {
        let home = std::env::var("HOME").unwrap();
        let expanded = expand_path("~/.agents/skills");

        assert_eq!(expanded, PathBuf::from(home).join(".agents/skills"));
    }

    #[test]
    fn keeps_absolute_path_unchanged() {
        let path = PathBuf::from("/Users/gaki2/Documents/agents/skills");
        let expanded = expand_path("/Users/gaki2/Documents/agents/skills");
        assert_eq!(expanded, path);
    }

    #[test]
    fn keeps_relative_path_unchanged() {
        let path = PathBuf::from("agents/skills");
        let expanded = expand_path("agents/skills");
        assert_eq!(expanded, path);

        let path = PathBuf::from("./agents/skills");
        let expanded = expand_path("./agents/skills");
        assert_eq!(expanded, path);
    }
}
