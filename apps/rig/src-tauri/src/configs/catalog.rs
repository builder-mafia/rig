use super::models::*;
use std::sync::OnceLock;

pub fn builtins() -> &'static [ConfigPlugin] {
    static PLUGINS: OnceLock<Vec<ConfigPlugin>> = OnceLock::new();
    PLUGINS.get_or_init(|| {
        vec![
            ConfigPlugin {
                schema_version: 1,
                id: "codex".into(),
                name: "Codex".into(),
                version: "1.0.0".into(),
                description: "Explore model, permissions, MCP servers, and other Codex settings."
                    .into(),
                icon: "codex".into(),
                homepage: Some(
                    "https://learn.chatgpt.com/docs/config-file/config-reference".into(),
                ),
                files: vec![ConfigFile {
                    id: "config".into(),
                    label: "config.toml".into(),
                    path: "~/.codex/config.toml".into(),
                    environment: Some(EnvironmentPath {
                        name: "CODEX_HOME".into(),
                        append: Some("config.toml".into()),
                    }),
                    format: ConfigFormat::Toml,
                    schema: Some(
                        serde_json::from_str(include_str!(
                            "../../../config-plugins/schemas/codex.schema.json"
                        ))
                        .expect("bundled Codex schema"),
                    ),
                }],
            },
            ConfigPlugin {
                schema_version: 1,
                id: "agent-browser".into(),
                name: "agent-browser".into(),
                version: "1.0.0".into(),
                description: "Explore browser launch, session, proxy, and provider settings."
                    .into(),
                icon: "browser".into(),
                homepage: Some("https://agent-browser.dev/configuration".into()),
                files: vec![ConfigFile {
                    id: "config".into(),
                    label: "config.json".into(),
                    path: "~/.agent-browser/config.json".into(),
                    environment: Some(EnvironmentPath {
                        name: "AGENT_BROWSER_CONFIG".into(),
                        append: None,
                    }),
                    format: ConfigFormat::Json,
                    schema: Some(
                        serde_json::from_str(include_str!(
                            "../../../config-plugins/schemas/agent-browser.schema.json"
                        ))
                        .expect("bundled agent-browser schema"),
                    ),
                }],
            },
            ConfigPlugin {
                schema_version: 1,
                id: "zsh".into(),
                name: "Zsh".into(),
                version: "1.0.0".into(),
                description:
                    "Read your shell configuration, aliases, exports, and startup commands.".into(),
                icon: "terminal".into(),
                homepage: Some("https://zsh.sourceforge.io/Doc/Release/Files.html".into()),
                files: vec![ConfigFile {
                    id: "zshrc".into(),
                    label: ".zshrc".into(),
                    path: "~/.zshrc".into(),
                    environment: Some(EnvironmentPath {
                        name: "ZDOTDIR".into(),
                        append: Some(".zshrc".into()),
                    }),
                    format: ConfigFormat::Text,
                    schema: None,
                }],
            },
            ConfigPlugin {
                schema_version: 1,
                id: "claude-code".into(),
                name: "Claude Code".into(),
                version: "1.0.0".into(),
                description:
                    "Edit your default model, permissions, hooks, and Claude Code preferences."
                        .into(),
                icon: "claude-code".into(),
                homepage: Some("https://code.claude.com/docs/en/settings".into()),
                files: vec![ConfigFile {
                    id: "settings".into(),
                    label: "settings.json".into(),
                    path: "~/.claude/settings.json".into(),
                    environment: Some(EnvironmentPath {
                        name: "CLAUDE_CONFIG_DIR".into(),
                        append: Some("settings.json".into()),
                    }),
                    format: ConfigFormat::Json,
                    schema: Some(
                        serde_json::from_str(include_str!(
                            "../../../config-plugins/schemas/claude-code.schema.json"
                        ))
                        .expect("bundled Claude Code schema"),
                    ),
                }],
            },
            ConfigPlugin {
                schema_version: 1,
                id: "starship".into(),
                name: "Starship".into(),
                version: "1.0.0".into(),
                description: "Customize your shell prompt, symbols, and Starship modules.".into(),
                icon: "starship".into(),
                homepage: Some("https://starship.rs/config/".into()),
                files: vec![ConfigFile {
                    id: "config".into(),
                    label: "starship.toml".into(),
                    path: "~/.config/starship.toml".into(),
                    environment: Some(EnvironmentPath {
                        name: "STARSHIP_CONFIG".into(),
                        append: None,
                    }),
                    format: ConfigFormat::Toml,
                    schema: Some(
                        serde_json::from_str(include_str!(
                            "../../../config-plugins/schemas/starship.schema.json"
                        ))
                        .expect("bundled Starship schema"),
                    ),
                }],
            },
            ConfigPlugin {
                schema_version: 1,
                id: "gemini-cli".into(),
                name: "Gemini CLI".into(),
                version: "1.0.0".into(),
                description:
                    "Edit Gemini CLI models, tools, MCP servers, and terminal preferences.".into(),
                icon: "gemini-cli".into(),
                homepage: Some("https://geminicli.com/docs/reference/configuration/".into()),
                files: vec![ConfigFile {
                    id: "settings".into(),
                    label: "settings.json".into(),
                    path: "~/.gemini/settings.json".into(),
                    environment: Some(EnvironmentPath {
                        name: "GEMINI_CLI_HOME".into(),
                        append: Some(".gemini/settings.json".into()),
                    }),
                    format: ConfigFormat::Json,
                    schema: Some(
                        serde_json::from_str(include_str!(
                            "../../../config-plugins/schemas/gemini-cli.schema.json"
                        ))
                        .expect("bundled Gemini CLI schema"),
                    ),
                }],
            },
        ]
    })
}
