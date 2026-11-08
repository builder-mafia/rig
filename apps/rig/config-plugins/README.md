# Rig configuration plugins, version 1

Config Hub opens and edits local configuration files. In **Source**, edit the file and select **Save**. In **Properties**, select a value and click outside the editor to save it. Clear the input or choose **Not set** to remove the property from the file. Rig validates JSON and TOML syntax before saving and reports conflicts when the file changes externally. Shell files are edited as text.

| Built-in plugin | Default file | Environment override |
| --- | --- | --- |
| Codex | `~/.codex/config.toml` | `$CODEX_HOME/config.toml` |
| agent-browser | `~/.agent-browser/config.json` | `$AGENT_BROWSER_CONFIG` |
| zsh | `~/.zshrc` | `$ZDOTDIR/.zshrc` |
| Claude Code | `~/.claude/settings.json` | `$CLAUDE_CONFIG_DIR/settings.json` |
| Starship | `~/.config/starship.toml` | `$STARSHIP_CONFIG` |
| Gemini CLI | `~/.gemini/settings.json` | `$GEMINI_CLI_HOME/.gemini/settings.json` |

Open **Config Hub → Add config plugins → Import plugin manifest**, select a JSON manifest, review its paths, and install it. Rig stores a manifest snapshot. Removing a plugin deletes its registration. Each plugin needs a unique ID. To replace a custom viewer, remove it and import its updated manifest.

## Minimal adapter

```json
{
  "schemaVersion": 1,
  "id": "example-tool",
  "name": "Example Tool",
  "version": "1.0.0",
  "description": "Inspect Example Tool's global settings.",
  "icon": "settings",
  "homepage": "https://example.com/docs",
  "files": [
    {
      "id": "global",
      "label": "config.json",
      "path": "~/.example-tool/config.json",
      "environment": { "name": "EXAMPLE_TOOL_HOME", "append": "config.json" },
      "format": "json",
      "schema": {
        "type": "object",
        "properties": {
          "enabled": {
            "type": "boolean",
            "description": "Enable Example Tool.",
            "default": true
          },
          "mode": {
            "type": "string",
            "description": "Choose how Example Tool runs.",
            "enum": ["safe", "full"]
          }
        }
      }
    }
  ]
}
```

## Manifest contract

- Required plugin fields: `schemaVersion` (currently `1`), `id`, `name`, `version`, `description`, `icon`, and `files` (1–20). Optional `homepage` must use HTTPS. Unknown manifest/file fields are rejected.
- Plugin and file IDs: 1–80 lowercase ASCII letters, digits, dots, or hyphens. File IDs are unique within a plugin. Names/labels are at most 100 bytes, versions 80 bytes, descriptions 2,000 bytes.
- File fields: `id`, `label`, `path`, `format`; optional `environment` and `schema`. Paths start with `~/` and cannot contain parent traversal. An optional environment override must resolve to an absolute path (or start with `~/`). With `append`, it names a directory; without `append`, it names the file itself. Environment names use uppercase ASCII letters, digits, and underscores. An unset variable uses `path`.
- Formats: `json`, `toml`, or `text`. JSON/TOML use an optional **embedded** JSON Schema. Text uses source view without a schema. Invalid JSON/TOML remains available as original source. Missing files still expose their available properties.
- Schema rendering supports descriptions, types, required fields, defaults, enums, constants, objects, arrays, dynamic keys via `additionalProperties`, `allOf`/`anyOf`/`oneOf`, and local JSON pointers (`$ref` to `#`/`#/…`, including `definitions`/`$defs`). Boolean schemas have no property guide. This is a property browser, not a complete JSON Schema validator. Other constraints remain in source schemas and upstream documentation; runtime values may differ because of environment variables and CLI flags.
- Icons: `codex`, `browser`, `terminal`, `settings`, `claude-code`, `starship`, `gemini-cli`, or an embedded `data:image/png;base64,…` image, at most 512×512 pixels and 180,000 base64 characters. Remote images and executable adapters are not supported. Include the library icon directly in the manifest for offline display.
- Files and manifests are UTF-8 and limited to 1 MiB each. The local plugin registry is limited to 8 MiB. File contents are loaded on selection and discarded from the query cache when the viewer unmounts. Nested properties expand on demand, with 50 entries per page and an eight-level UI depth limit. Source view uses one text node rather than creating a DOM node per line.
- Sensitive-looking property names are masked initially; users can reveal them or open/copy the complete source. Config contents are not stored in the plugin registry. Reads follow links within the home directory or an explicitly configured environment directory; symlinks escaping both are rejected.

## Bundled schema snapshots

The snapshots are bundled for offline use. Codex and agent-browser were retrieved on 2026-11-07. Claude Code, Starship, and Gemini CLI were retrieved on 2026-11-08.

- Codex: [schema](https://developers.openai.com/codex/config-schema.json), [reference](https://learn.chatgpt.com/docs/config-file/config-reference).
- agent-browser: [schema](https://agent-browser.dev/schema.json), [configuration](https://agent-browser.dev/configuration).
- Claude Code: [published schema](https://json.schemastore.org/claude-code-settings.json), [settings documentation](https://code.claude.com/docs/en/settings).
- Starship: [schema](https://starship.rs/config-schema.json), [configuration](https://starship.rs/config/).
- Gemini CLI: [schema](https://raw.githubusercontent.com/google-gemini/gemini-cli/main/schemas/settings.schema.json), [configuration](https://geminicli.com/docs/reference/configuration/).
- zsh: [startup files](https://zsh.sourceforge.io/Doc/Release/Files.html). No schema is provided for arbitrary shell scripts.

Schema snapshots describe the upstream versions at retrieval time. The installed library version may support a different set of options; undeclared properties in the user's file stay visible.

The agent-browser and zsh icons come from Dashboard Icons. Rig bundles the original black Vercel SVG and inverts it with CSS in dark mode. See the [Vercel icon](https://dashboardicons.com/icons/vercel), [Terminal icon](https://dashboardicons.com/icons/terminal), and [license](../public/application_icon/DASHBOARD-ICONS-LICENSE).

The new icons use Clawd by Lucas Paul, Starship from Simple Icons, and the Gemini CLI community image by Adam Mikołajczyk. The Gemini CLI image is resized to 128 pixels for the app. [Clawd](https://dashboardicons.com/icons/clawd) · [Starship](https://www.dashboardicons.com/icons/external/simpleicons/starship) · [Gemini CLI](https://dashboardicons.com/community/gemini-cli)
